import { GoogleGenAI } from "@google/genai";
import { requireEnv } from "@/lib/env";
import { SYSTEM_PROMPT } from "@/lib/knowledge";

/**
 * The model layer. Every provider-specific detail lives here so the route
 * handler only deals with HTTP.
 *
 * WHY GEMINI, AND WHAT IT CHANGED
 *
 * This ran on Claude Sonnet 5 first. The switch is not about model quality —
 * it is about a failure mode that only shows up in operation: a prepaid
 * balance runs out silently. Nobody watches a portfolio's billing page, so
 * "the assistant died three weeks ago" is a thing you find out from a
 * recruiter, or never. Gemini's free tier cannot run out of money; it can only
 * hit a daily request ceiling and recover the next day.
 *
 * Two consequences worth understanding before editing this file:
 *
 * 1. Prompt caching is no longer load-bearing. On Claude, cache reads at ~10%
 *    of input price were the whole argument for putting the entire knowledge
 *    base in the system prompt. Free-tier inference costs nothing, so that
 *    argument is moot — the reason the knowledge base still goes in whole is
 *    the *other* half of the original decision: the corpus is ~6.3k tokens, it
 *    fits, and retrieval over something this small can only introduce wrong
 *    chunks. Gemini does implicit prefix caching; `usage.cached` reports it,
 *    but nothing here depends on it.
 *
 * 2. The binding constraint moved from dollars to requests. Free tier is
 *    roughly 1,500 requests/day, which is well above the ~500/day cap in
 *    rate-limit.ts, so that cap still bites first. If Google's limit is ever
 *    hit, the API returns a 429 and the UI degrades to the contact form.
 *
 * PRIVACY: free-tier input is used by Google to improve their products. That
 * is the price of the free tier and it is disclosed in the UI copy — visitors
 * are told their questions go to a third-party model. `store: false` at least
 * keeps responses from being retained for later retrieval.
 */

/**
 * Chosen by measurement, and then re-chosen when measurement disagreed with
 * the first choice.
 *
 * `gemini-3.7-flash` returns 429 "exceeded your current quota" on this account
 * — not usable on the free tier at all. `gemini-2.5-flash` is retired (404).
 * Of what worked, measured with this exact system prompt:
 *
 *   gemini-3.6-flash        4/4 requests ok, median 5.1s
 *   gemini-3.5-flash        4/4 ok, median 5.7s
 *   gemini-3.5-flash-lite   4/4 ok, median 4.5s
 *   gemini-3.1-flash-lite   4/4 ok, median 4.5s
 *
 * The first pick was gemini-3.6-flash, on the reasoning that a full Flash
 * follows a long instruction set better than a Lite and ~600ms was worth it.
 * That was wrong for an operational reason, not a quality one:
 *
 * FREE-TIER QUOTAS ARE PER MODEL, AND 3.6-FLASH'S IS SMALL. Roughly 80
 * requests across one afternoon of benchmarking and two eval runs exhausted
 * it, after which every request 429'd — while both Lite models kept answering
 * instantly on their own separate quotas. A model whose daily allowance a
 * single eval run can exhaust cannot host the endpoint AND be verifiable.
 *
 * So: a Lite. Which Lite was then decided by a second measurement, on a
 * question that asks for detail ("walk me through the trade-offs"):
 *
 *   gemini-3.5-flash-lite   thought=477  out=19   ->    84 chars (truncated)
 *   gemini-3.1-flash-lite   thought=124  out=372  ->  1980 chars
 *   gemini-3.5-flash        thought=0    out=470  ->  2355 chars
 *
 * 3.5-flash-lite burned 477 of a 500-token budget thinking and had 19 left to
 * answer with — see MAX_OUTPUT_TOKENS below. 3.1-flash-lite thinks briefly and
 * answers properly, so it wins: a Lite's separate quota plus an answer that
 * actually arrives. If the evals ever disagree, gemini-3.5-flash is one line
 * away — it answered best of all, at the cost of a full-Flash quota.
 */
export const MODEL = "gemini-3.1-flash-lite";

/**
 * Bounds the answer length. Not a cost control any more (inference is free) —
 * a UX one, and a trap worth naming.
 *
 * THINKING TOKENS COUNT AGAINST THIS BUDGET. At 500, gemini-3.5-flash-lite
 * spent 477 tokens thinking about "walk me through the trade-offs" and had 19
 * left to answer with, producing a sentence that stopped mid-list. There is no
 * error for this — `total_output_tokens` just comes back tiny and the answer
 * looks like the model had nothing to say. 1200 leaves room for both on every
 * model measured; the actual answer length is governed by the style rules in
 * the system prompt, not by this ceiling.
 */
const MAX_OUTPUT_TOKENS = 1200;

export type Turn = { role: "user" | "assistant"; content: string };

export type Usage = {
  input: number;
  output: number;
  /** Implicit prefix cache, reported for visibility. Nothing depends on it. */
  cached: number;
};

let client: GoogleGenAI | null = null;

/**
 * Lazy: the key must not be read at module scope. Vercel redacts sensitive
 * variables during the build, and Next evaluates route modules while
 * collecting page data, so an eager client can fail the build.
 */
function getClient(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  return client;
}

/** Our transcript shape -> the Interactions API's step shape. */
const toInput = (turns: Turn[]) =>
  turns.map((turn) => ({
    type: turn.role === "user" ? ("user_input" as const) : ("model_output" as const),
    content: [{ type: "text" as const, text: turn.content }],
  }));

/**
 * One place the request is built, so the streaming and non-streaming paths
 * cannot drift apart and start behaving differently under eval.
 *
 * `thinking_level: "low"` is the floor this model accepts and the equivalent
 * of the old thinking-disabled setting: answering from a fixed knowledge base
 * is retrieval, not reasoning, and thinking only adds latency.
 */
const params = (turns: Turn[]) => ({
  model: MODEL,
  system_instruction: SYSTEM_PROMPT,
  input: toInput(turns),
  generation_config: {
    max_output_tokens: MAX_OUTPUT_TOKENS,
    // "low", not "minimal": the SDK's types accept "minimal" but this model
    // rejects it at runtime (400, allowed values high/low/medium). Answering
    // from a fixed knowledge base is retrieval, not reasoning, so the floor
    // the model actually supports is what we want.
    thinking_level: "low" as const,
  },
  /**
   * `store: true` is a measured decision, not a default.
   *
   * The privacy-preferring choice is `false` — it keeps Google from retaining
   * the interaction for later retrieval. But measured over 4 streamed requests
   * each with this prompt:
   *
   *   store: true    4/4 ok, first token 1.7-2.6s, 12-17 deltas
   *   store: false   3/4 ok (ECONNRESET), first token 2.5-4.6s, 2-15 deltas
   *
   * So `false` is both less reliable and twice as slow to first token. Given
   * free-tier input is already used by Google to improve their models — which
   * `store: false` does nothing to prevent, and which the UI discloses — the
   * marginal privacy gained is small and the cost in reliability is not.
   */
  store: true,
});

const readUsage = (usage: {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_cached_tokens?: number;
} | undefined): Usage => ({
  input: usage?.total_input_tokens ?? 0,
  output: usage?.total_output_tokens ?? 0,
  cached: usage?.total_cached_tokens ?? 0,
});

/** Non-streaming: what the eval harness asserts against. */
export async function answer(
  turns: Turn[],
): Promise<{ text: string; usage: Usage; finish: string }> {
  const interaction = await getClient().interactions.create({
    ...params(turns),
    stream: false,
  });

  return {
    text: (interaction.output_text ?? "").trim(),
    usage: readUsage(interaction.usage),
    finish: interaction.status ?? "unknown",
  };
}

export type StreamEvent =
  /** Append this text. */
  | { type: "delta"; text: string }
  /** Discard everything streamed so far; a complete answer follows. */
  | { type: "reset" }
  | { type: "done"; usage: Usage };

/**
 * Streaming. Yields text deltas as they arrive, then a final usage event.
 *
 * The SDK's Stream extends ReadableStream, so cancelling it is how we stop
 * generating for a visitor who has navigated away.
 */
export async function* answerStream(
  turns: Turn[],
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  let emitted = 0;

  try {
    const stream = await getClient().interactions.create({
      ...params(turns),
      stream: true,
    });

    const onAbort = () => void stream.cancel().catch(() => {});
    signal.addEventListener("abort", onAbort);

    let usage: Usage = { input: 0, output: 0, cached: 0 };

    try {
      for await (const event of stream) {
        if (signal.aborted) return;

        if (event.event_type === "step.delta" && event.delta.type === "text") {
          emitted += 1;
          yield { type: "delta", text: event.delta.text };
        }
        // Usage arrives on the closing events, not the deltas.
        if (event.event_type === "step.stop" && event.usage) {
          usage = readUsage(event.usage);
        }
        if (event.event_type === "interaction.completed" && event.interaction?.usage) {
          usage = readUsage(event.interaction.usage);
        }
      }
    } finally {
      signal.removeEventListener("abort", onAbort);
    }

    yield { type: "done", usage };
    return;
  } catch (error) {
    if (signal.aborted) return;

    /**
     * Streams to this endpoint drop the connection often enough to need a
     * plan: measured over 6 runs with this model and prompt, 4 completed, 1
     * died before the first token, and 1 died mid-answer.
     *
     * Both are recovered the same way — re-ask without streaming — but a
     * mid-answer failure has to tell the client to throw away the half
     * sentence it has already rendered first, hence the `reset` event.
     * Leaving the partial text on screen and appending a second attempt to it
     * would produce a garbled answer, and leaving it there with an error is
     * how a visitor concludes the site is broken.
     */
    console.warn(
      `[chat] stream failed after ${emitted} deltas — retrying without streaming`,
      error instanceof Error ? error.message : error,
    );
    if (emitted > 0) yield { type: "reset" };
  }

  const fallback = await answer(turns);
  if (!fallback.text) throw new Error("empty answer from non-streaming fallback");
  yield { type: "delta", text: fallback.text };
  yield { type: "done", usage: fallback.usage };
}

/**
 * Maps a provider error to a visitor-facing message and a status code.
 *
 * Keyed on the numeric `status` property rather than `instanceof`, and that is
 * deliberate: the SDK exports a class called `ApiError`, but the errors it
 * actually throws (`RateLimitError`, `APIConnectionError`, `BadRequestError`)
 * extend a *different*, unexported internal class with almost the same name.
 * An `instanceof ApiError` check therefore misses every real error — which is
 * how a 429 first reached visitors as a generic 500. Every thrown error does
 * carry `status`, so that is what we read.
 */
function statusOf(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return null;
}

/** The 429 body carries "Please retry in 52.8s" — pass it to the client. */
function retryAfterFrom(error: unknown): number | undefined {
  const message = error instanceof Error ? error.message : String(error);
  const match = /retry in ([\d.]+)s/i.exec(message);
  return match ? Math.ceil(Number(match[1])) : undefined;
}

export function describe(error: unknown): {
  message: string;
  status: number;
  retryAfter?: number;
} {
  const status = statusOf(error);
  const detail = error instanceof Error ? error.message.slice(0, 200) : String(error);

  // The free tier's per-minute request ceiling. This is the limit that
  // replaced "the balance ran out" — it clears by itself, which is the whole
  // reason for being on this provider.
  if (status === 429) {
    console.error("[chat] provider quota", detail);
    return {
      message: "The assistant is busy right now. Please try again in a minute.",
      status: 429,
      retryAfter: retryAfterFrom(error) ?? 60,
    };
  }

  if (status === 401 || status === 403) {
    console.error("[chat] GEMINI_API_KEY rejected", status, detail);
    return {
      message:
        "The assistant isn't wired up correctly. Please use the contact form to reach Anish directly.",
      status: 503,
    };
  }

  // A 400 means WE built a bad request — a bug, not a visitor problem.
  if (status === 400) {
    console.error("[chat] malformed request to provider (our bug)", detail);
    return {
      message: "Something went wrong answering that. Please try again, or use the contact form.",
      status: 502,
    };
  }

  // No status at all is a transport failure — the connection resets on this
  // endpoint often enough to be worth naming rather than calling unexpected.
  console.error(
    status === null ? "[chat] provider connection failure" : `[chat] provider error ${status}`,
    detail,
  );
  return {
    message: "Something went wrong answering that. Please try again, or use the contact form.",
    status: 502,
  };
}
