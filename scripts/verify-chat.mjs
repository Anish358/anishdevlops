/**
 * Verification for /api/chat.
 *
 * Asserts the things that are machine-checkable:
 *   1. The endpoint answers.
 *   2. The knowledge base actually reaches the model — checked by input token
 *      count, so a broken SYSTEM_PROMPT wiring cannot pass silently.
 *   3. Streaming really streams (measured, not assumed).
 *   4. A replayed multi-turn transcript is accepted.
 *
 * WHAT CHANGED WHEN THIS MOVED OFF CLAUDE
 *
 * This file used to assert on prompt caching: that a second request read ~6.3k
 * cached tokens, proving a byte-identical prefix. Those assertions are gone,
 * not because caching stopped mattering to correctness, but because it was
 * never a correctness property — it was a *cost* property, and free-tier
 * inference has no cost to optimise. Gemini does implicit prefix caching and
 * the runs below report it, but asserting a non-zero cached count would be
 * asserting on an optimisation the provider makes no promises about, which is
 * how a suite starts failing for reasons nobody can act on.
 *
 * The assertion that replaced them is better anyway: it checks the knowledge
 * base is present in the request at all.
 *
 *   pnpm dev                     # in one terminal
 *   pnpm verify:chat             # in another
 *   BASE_URL=https://anishdevlops.xyz pnpm verify:chat
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL.replace(/\/$/, "")}/api/chat`;

/**
 * This script sends more questions than one visitor is allowed per hour, so
 * each request presents a distinct synthetic address. Deliberate: this file
 * verifies answers and transport; `pnpm verify:limits` verifies the limiter.
 * Conversation state lives in the request body, not a session, so a
 * per-request address changes nothing else.
 */
const asVisitor = () => ({
  "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250) + 1}`,
});

/** The knowledge base is ~6.3k tokens; anything near this means it was sent. */
const MIN_EXPECTED_INPUT = 4000;

async function post(payload) {
  return fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...asVisitor() },
    body: JSON.stringify(payload),
  });
}

async function ask(question) {
  const response = await post({ messages: [{ role: "user", content: question }] });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${response.status} from ${ENDPOINT}: ${body.error ?? "(no error body)"}`);
  }
  if (body.mock) {
    console.error(
      "\nThe endpoint is in CHAT_MOCK mode, so no model was called.\n" +
        "Unset CHAT_MOCK, set GEMINI_API_KEY, restart the dev server, rerun.\n",
    );
    process.exit(1);
  }
  return body;
}

const failures = [];
const check = (label, condition, detail) => {
  console.log(`${condition ? "  PASS" : "  FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!condition) failures.push(label);
};

console.log(`\nVerifying ${ENDPOINT}\n`);
console.log("Grounding & request shape");

const first = await ask("Where does Anish work?");
check("the endpoint answers", Boolean(first.reply));
check(
  "the answer is grounded in the knowledge base",
  /kamakhya/i.test(first.reply ?? ""),
  `"${(first.reply ?? "").slice(0, 70)}…"`,
);
check(
  "the knowledge base reached the model",
  (first.usage?.input ?? 0) >= MIN_EXPECTED_INPUT,
  `input_tokens=${first.usage?.input ?? 0} (expected >= ${MIN_EXPECTED_INPUT})`,
);

const second = await ask("What databases has he used?");
console.log(
  `\n  usage — in ${second.usage?.input} · out ${second.usage?.output} · ` +
    `implicitly cached ${second.usage?.cached} (reported, not asserted)\n`,
);

console.log("Streaming");

/** Reads the SSE response, timing when the first token actually lands. */
async function askStreaming(question) {
  const startedAt = Date.now();
  const response = await post({
    stream: true,
    messages: [{ role: "user", content: question }],
  });

  const events = [];
  let text = "";
  let firstTokenAt = null;
  let buffer = "";
  let recovered = false;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const event = JSON.parse(line.slice(6));
      events.push(event);
      // The server dropped a stream and is re-answering; discard the partial.
      if (event.type === "reset") {
        recovered = true;
        text = "";
        firstTokenAt = null;
      }
      if (event.type === "delta") {
        firstTokenAt ??= Date.now() - startedAt;
        text += event.text;
      }
    }
  }

  return {
    contentType: response.headers.get("content-type") ?? "",
    events,
    text,
    firstTokenAt,
    recovered,
    totalMs: Date.now() - startedAt,
  };
}

const streamed = await askStreaming("Walk me through the trade-offs he made building PropVexis.");
const deltas = streamed.events.filter((e) => e.type === "delta");
const done = streamed.events.find((e) => e.type === "done");

check(
  "responds as an event stream",
  streamed.contentType.includes("text/event-stream"),
  streamed.contentType,
);

/**
 * Streams to this provider drop perhaps 1 in 3 times, so the server recovers
 * by re-answering without streaming and sending a `reset` first. That means
 * the assertions below have to hold in BOTH cases — a suite that only passes
 * on the happy path would go red a third of the time and teach everyone to
 * ignore it.
 *
 * What must always be true: a complete answer arrives and the stream closes
 * properly. Incremental delivery is only asserted when the stream survived,
 * because a recovered answer legitimately arrives in one piece.
 */
check("a complete answer arrives", streamed.text.length > 200, `${streamed.text.length} chars`);
check("the stream closes properly", Boolean(done), streamed.recovered ? "after recovering" : "cleanly");

if (streamed.recovered) {
  console.log(
    "  NOTE  this stream dropped and was recovered without streaming — " +
      "the answer is complete, the streaming effect was lost for this one",
  );
} else {
  check("arrives incrementally, not in one lump", deltas.length > 3, `${deltas.length} delta events`);
  check(
    "first token beats the full response",
    streamed.firstTokenAt !== null && streamed.firstTokenAt < streamed.totalMs * 0.8,
    `first token at ${streamed.firstTokenAt}ms, complete at ${streamed.totalMs}ms`,
  );
}

console.log("");
console.log("Multi-turn");

// Exactly what the chat panel does on a follow-up: replay the whole
// alternating transcript. The server rejects a history that doesn't start and
// end on the user, so this is the shape most likely to break silently.
const opener = "What is PropVexis?";
const firstAnswer = await ask(opener);
const followUp = await post({
  messages: [
    { role: "user", content: opener },
    { role: "assistant", content: firstAnswer.reply },
    { role: "user", content: "Why did he choose Redis for it?" },
  ],
}).then((r) => r.json());

check("accepts a replayed transcript", Boolean(followUp.reply), followUp.error ?? "");
check(
  "prior turns are included in the request",
  (followUp.usage?.input ?? 0) > (firstAnswer.usage?.input ?? 0),
  `${followUp.usage?.input} vs ${firstAnswer.usage?.input} on a fresh question`,
);
console.log(`\n  Follow-up answer: ${(followUp.reply ?? "").slice(0, 160)}…\n`);

if (failures.length) {
  console.error(`FAILED: ${failures.join("; ")}\n`);
  process.exit(1);
}
console.log("All assertions passed.\n");
