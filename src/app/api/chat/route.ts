import { after, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { answer, answerStream, describe, type Turn } from "@/lib/model";
import { logQuestion } from "@/lib/questions";
import { checkLimits } from "@/lib/rate-limit";

/**
 * The chat endpoint. Follows the shape of /api/contact: every failure path
 * degrades honestly to the contact form, and nothing is ever fabricated to
 * cover an outage.
 *
 * Model specifics live in src/lib/model.ts; this file is HTTP concerns only —
 * validation, limits, streaming transport, error status codes.
 */

const LIMITS = {
  /** Bounds input size and blocks prompt-stuffing. */
  messageChars: 500,
  /** History grows the request every turn. */
  userTurns: 12,
} as const;

/**
 * Answers a canned string instead of calling the model, so the chat UI can be
 * developed without touching the provider. Guarded twice — explicit opt-in AND
 * a non-production build — because a mock reaching a real visitor is worse
 * than an outage.
 *
 * It proves the plumbing and nothing else: grounding, scope and injection
 * resistance are only tested by `pnpm eval` against the real model.
 */
const MOCK = env("CHAT_MOCK") === "1" && process.env.NODE_ENV !== "production";

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  // no-transform stops proxies buffering the stream into one lump.
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
} as const;

/** Returns the validated history, or an error string a visitor can act on. */
function parseHistory(value: unknown): Turn[] | string {
  if (!Array.isArray(value) || value.length === 0) return "No message to answer.";

  const turns: Turn[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) return "Malformed message.";
    const { role, content } = entry as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return "Malformed message.";
    if (typeof content !== "string") return "Malformed message.";

    const text = content.trim();
    if (!text) return "Malformed message.";
    if (role === "user" && text.length > LIMITS.messageChars) {
      return `Questions are limited to ${LIMITS.messageChars} characters. Try asking something shorter, or use the contact form.`;
    }
    turns.push({ role, content: text });
  }

  // An alternating transcript that starts and ends on the user.
  if (turns[0].role !== "user" || turns[turns.length - 1].role !== "user") {
    return "Malformed conversation.";
  }
  for (let i = 1; i < turns.length; i += 1) {
    if (turns[i].role === turns[i - 1].role) return "Malformed conversation.";
  }

  if (turns.filter((turn) => turn.role === "user").length > LIMITS.userTurns) {
    return "This conversation has run long. Please start a new one, or use the contact form to reach Anish directly.";
  }

  return turns;
}

const frame = (encoder: TextEncoder, payload: unknown) =>
  encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

/**
 * Server-sent events. Perceived latency is most of this feature's experience —
 * a several-second wait for a finished paragraph feels broken next to text
 * that starts immediately.
 *
 * Note the asymmetry: once a 200 and the first byte are out, the status code
 * can no longer change, so a mid-stream failure has to arrive as an `error`
 * event the client renders. Failures before the stream opens still get a real
 * status code, via the JSON path.
 */
function streamResponse(turns: Turn[], signal: AbortSignal) {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of answerStream(turns, signal)) {
          controller.enqueue(frame(encoder, event));
          if (event.type === "done") {
            console.log(
              `[chat] stream in=${event.usage.input} out=${event.usage.output} cached=${event.usage.cached}`,
            );
          }
        }
      } catch (error) {
        if (!signal.aborted) {
          controller.enqueue(frame(encoder, { type: "error", message: describe(error).message }));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: SSE_HEADERS });
}

/** The mock has to answer in whichever shape was asked for. */
function mockResponse(turns: Turn[], streaming: boolean) {
  const asked = turns[turns.length - 1].content;
  const reply =
    `[MOCK — no model was called, this answer is not real] You asked: "${asked}". ` +
    `Set GEMINI_API_KEY and drop CHAT_MOCK to get a grounded answer.`;
  const usage = { input: 0, output: 0, cached: 0 };

  if (!streaming) return NextResponse.json({ mock: true, reply, usage });

  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(frame(encoder, { type: "mock" }));
        for (const word of reply.split(" ")) {
          controller.enqueue(frame(encoder, { type: "delta", text: `${word} ` }));
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        controller.enqueue(frame(encoder, { type: "done", usage }));
        controller.close();
      },
    }),
    { headers: SSE_HEADERS },
  );
}

export async function POST(request: Request) {
  let body: { messages?: unknown; stream?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Malformed request.", 400);
  }

  const history = parseHistory(body.messages);
  if (typeof history === "string") return fail(history, 400);

  const streaming = body.stream === true;

  // Before the mock, not after: the endpoint is either protected or it isn't,
  // and running the limiter on every path is also what makes it testable
  // without calling the model.
  const decision = await checkLimits(request);
  if (!decision.ok) {
    return NextResponse.json(
      { error: decision.error },
      {
        status: decision.status,
        headers: decision.retryAfter ? { "Retry-After": String(decision.retryAfter) } : undefined,
      },
    );
  }

  // Questions only, and only real ones: no IP, no answer, no history, and
  // nothing from mock mode — dev and production share one Upstash instance, so
  // local UI testing would otherwise drown the signal this log exists for.
  // after() runs once the response has been sent, so it costs the visitor
  // nothing.
  if (!MOCK) {
    const question = history[history.length - 1].content;
    after(() => logQuestion(question));
  }

  if (MOCK) return mockResponse(history, streaming);

  if (!env("GEMINI_API_KEY")) {
    console.error("[chat] GEMINI_API_KEY is not set — cannot answer.");
    return fail(
      "The assistant isn't wired up yet. Please use the contact form to reach Anish directly.",
      503,
    );
  }

  if (streaming) return streamResponse(history, request.signal);

  try {
    const { text, usage, finish } = await answer(history);
    console.log(
      `[chat] status=${finish} in=${usage.input} out=${usage.output} cached=${usage.cached}`,
    );

    if (!text) {
      console.error("[chat] empty reply", finish);
      return fail(
        "The assistant didn't manage an answer to that. Please try rephrasing, or use the contact form.",
        502,
      );
    }

    return NextResponse.json({ reply: text, usage, finish });
  } catch (error) {
    const { message, status, retryAfter } = describe(error);
    return NextResponse.json(
      { error: message },
      { status, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined },
    );
  }
}
