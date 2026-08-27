import Anthropic from "@anthropic-ai/sdk";
import { after, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/knowledge";
import { logQuestion } from "@/lib/questions";
import { checkLimits } from "@/lib/rate-limit";

/**
 * Phase 1: non-streaming, so answers can be verified with curl before the
 * streaming plumbing goes in. Rate limiting and the global daily cap land in
 * Phase 3; the bounds below are the ones that cost nothing and keep the
 * endpoint from being an unbounded public LLM proxy in the meantime.
 */
const MODEL = "claude-sonnet-5";

const LIMITS = {
  /** Hard ceiling on the most expensive part of a request. */
  maxTokens: 500,
  /** Bounds input cost and blocks prompt-stuffing. */
  messageChars: 500,
  /** History grows the request every turn. */
  userTurns: 12,
} as const;

type Turn = { role: "user" | "assistant"; content: string };

/**
 * Answers a canned string instead of calling the API, so the chat UI can be
 * built without credits. Guarded twice — an explicit opt-in AND a non-production
 * build — because a mock that reaches a real visitor is worse than an outage.
 *
 * It proves the plumbing works and nothing else. Grounding, scope, injection
 * resistance and caching are all untested under CHAT_MOCK; only a real key
 * and `pnpm verify:chat` test those.
 */
const MOCK =
  process.env.CHAT_MOCK === "1" && process.env.NODE_ENV !== "production";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

/**
 * One place where the request is built, so the streaming and non-streaming
 * paths cannot drift apart. If they did, they would cache under different
 * prefixes and quietly halve the hit rate.
 */
const requestParams = (messages: Turn[]) =>
  ({
    model: MODEL,
    max_tokens: LIMITS.maxTokens,
    // The cache breakpoint. Everything above it is byte-stable; the visitor's
    // messages sit below it, where they belong.
    system: [
      {
        type: "text" as const,
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    // Answering from a fixed knowledge base is retrieval, not reasoning.
    // Thinking would add latency and tokens for no gain here.
    thinking: { type: "disabled" as const },
    output_config: { effort: "low" as const },
    messages,
  }) satisfies Anthropic.MessageCreateParams;

type Usage = Anthropic.Message["usage"];

const readUsage = (usage: Usage) => ({
  input: usage.input_tokens,
  output: usage.output_tokens,
  cacheWrite: usage.cache_creation_input_tokens ?? 0,
  cacheRead: usage.cache_read_input_tokens ?? 0,
});

/**
 * The only honest way to know caching works. If cacheRead stays 0 across
 * repeat requests, something above the breakpoint is changing.
 */
const logUsage = (stopReason: string | null, usage: ReturnType<typeof readUsage>) =>
  console.log(
    `[chat] stop=${stopReason} in=${usage.input} out=${usage.output} ` +
      `cache_write=${usage.cacheWrite} cache_read=${usage.cacheRead}`,
  );

/** Maps an SDK error to a visitor-facing message and a status. */
function describe(error: unknown): { message: string; status: number } {
  if (error instanceof Anthropic.RateLimitError) {
    console.error("[chat] rate limited", error.message);
    return { message: "The assistant is busy right now. Please try again shortly.", status: 429 };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("[chat] ANTHROPIC_API_KEY rejected", error.message);
    return {
      message:
        "The assistant isn't wired up correctly. Please use the contact form to reach Anish directly.",
      status: 503,
    };
  }
  if (error instanceof Anthropic.APIError) {
    console.error("[chat] upstream failure", error.status, error.message);
    return {
      message: "Something went wrong answering that. Please try again, or use the contact form.",
      status: 502,
    };
  }
  console.error("[chat] unexpected failure", error);
  return {
    message: "Something went wrong answering that. Please try again, or use the contact form.",
    status: 500,
  };
}

/**
 * Server-sent events. Perceived latency is most of this feature's experience —
 * a three-second wait for a finished paragraph feels broken next to text that
 * starts immediately.
 *
 * Note the asymmetry in error handling: once a 200 and the first byte are out,
 * the status code can no longer be changed, so a mid-stream failure has to
 * arrive as an `error` event that the client renders. Failures before the
 * stream opens still get a real status code, via the JSON path below.
 */
function streamResponse(messages: Turn[], signal: AbortSignal) {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      const stream = client.messages.stream(requestParams(messages));
      // Don't keep generating tokens nobody will read.
      const abort = () => stream.abort();
      signal.addEventListener("abort", abort);

      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send({ type: "delta", text: event.delta.text });
          }
        }

        const message = await stream.finalMessage();
        const usage = readUsage(message.usage);
        logUsage(message.stop_reason, usage);
        send({ type: "done", usage, stopReason: message.stop_reason });
      } catch (error) {
        if (signal.aborted) return; // visitor navigated away; not an error
        send({ type: "error", message: describe(error).message });
      } finally {
        signal.removeEventListener("abort", abort);
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // no-transform stops proxies buffering the stream into one lump.
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}

/** Returns the validated history, or an error string a visitor can act on. */
function parseHistory(value: unknown): Turn[] | string {
  if (!Array.isArray(value) || value.length === 0) {
    return "No message to answer.";
  }

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

  // The API requires an alternating transcript that starts and ends on the user.
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

export async function POST(request: Request) {
  let body: { messages?: unknown; stream?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Malformed request.", 400);
  }

  const history = parseHistory(body.messages);
  if (typeof history === "string") return fail(history, 400);

  // Before the mock, not after: the endpoint is either protected or it isn't,
  // and running the limiter on every path is also what makes it testable
  // without spending anything.
  const decision = await checkLimits(request);
  if (!decision.ok) {
    return NextResponse.json(
      { error: decision.error },
      {
        status: decision.status,
        headers: decision.retryAfter
          ? { "Retry-After": String(decision.retryAfter) }
          : undefined,
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

  if (MOCK) {
    const asked = history[history.length - 1].content;
    const reply =
      `[MOCK — no model was called, this answer is not real] You asked: "${asked}". ` +
      `Set ANTHROPIC_API_KEY and drop CHAT_MOCK to get a grounded answer.`;
    const usage = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };

    // The mock has to answer in whichever shape was asked for. Returning JSON
    // to a caller reading an event stream makes the mock useless from the very
    // UI it exists to support.
    if (body.stream === true) {
      const encoder = new TextEncoder();
      const frame = (payload: unknown) =>
        encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

      return new Response(
        new ReadableStream<Uint8Array>({
          async start(controller) {
            controller.enqueue(frame({ type: "mock" }));
            // Chunked so the streaming UI has something to animate.
            for (const word of reply.split(" ")) {
              controller.enqueue(frame({ type: "delta", text: `${word} ` }));
              await new Promise((resolve) => setTimeout(resolve, 20));
            }
            controller.enqueue(frame({ type: "done", usage, stopReason: "end_turn" }));
            controller.close();
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        },
      );
    }

    return NextResponse.json({ mock: true, reply, usage, stopReason: "end_turn" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[chat] ANTHROPIC_API_KEY is not set — cannot answer.");
    return fail(
      "The assistant isn't wired up yet. Please use the contact form to reach Anish directly.",
      503,
    );
  }

  // Streaming is what the browser wants; the eval harness wants one JSON blob
  // it can assert on. Both build their request through requestParams().
  if (body.stream === true) {
    return streamResponse(history, request.signal);
  }

  try {
    const message = await client.messages.create(requestParams(history));

    const reply = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    const usage = readUsage(message.usage);
    logUsage(message.stop_reason, usage);

    if (!reply) {
      console.error("[chat] empty reply", message.stop_reason);
      return fail(
        "The assistant didn't manage an answer to that. Please try rephrasing, or use the contact form.",
        502,
      );
    }

    return NextResponse.json({ reply, usage, stopReason: message.stop_reason });
  } catch (error) {
    const { message, status } = describe(error);
    return fail(message, status);
  }
}
