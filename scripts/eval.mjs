/**
 * Runs the eval set against a live /api/chat and exits non-zero on any
 * failure, so it can gate a deploy.
 *
 *   pnpm dev                 # in one terminal
 *   pnpm eval                # in another
 *   BASE_URL=https://... pnpm eval
 *   pnpm eval injection      # just one group
 *
 * Free to run on Gemini's free tier — it reports token totals instead of a
 * dollar figure, and counts requests against the free tier's daily ceiling,
 * which is the constraint that replaced cost.
 */

import { cases } from "../evals/cases.mjs";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL.replace(/\/$/, "")}/api/chat`;
const only = process.argv[2];

/** One synthetic visitor per request: the limiter is verified by verify:limits. */
const visitor = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}`;

const selected = only ? cases.filter((c) => c.group === only) : cases;
if (!selected.length) {
  console.error(
    `No cases in group "${only}". Groups: ${[...new Set(cases.map((c) => c.group))].join(", ")}`,
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * The measured free-tier ceiling is 20 requests/minute, and this suite is
 * wider than that, so a 429 is an expected part of a run rather than a
 * failure. Backing off on the provider's own Retry-After hint is the
 * difference between measuring the model and measuring the quota. A full run
 * therefore takes a couple of minutes.
 */
async function post(question, attempt = 0) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": visitor() },
    body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
  });

  if (response.status === 429 && attempt < 6) {
    // The provider tells us how long to wait; trust it over a guess.
    const hinted = Number(response.headers.get("retry-after"));
    const wait = Number.isFinite(hinted) && hinted > 0 ? (hinted + 1) * 1000 : 5000 * 2 ** attempt;
    await sleep(wait);
    return post(question, attempt + 1);
  }

  /**
   * Transport failures get retried too, and that is not papering over a bug.
   * This provider resets connections often enough that a 37-case run hits one
   * most times — the first full run on Gemini failed a single case on a 502
   * with an empty body, which says nothing about whether the model behaves.
   * Retrying separates "the model got this wrong" (what this suite measures)
   * from "the connection dropped" (what it must not measure). A failure that
   * survives three attempts still fails the run.
   */
  if ((response.status === 502 || response.status === 503) && attempt < 3) {
    await sleep(2000 * (attempt + 1));
    return post(question, attempt + 1);
  }
  return response;
}

async function run(testCase) {
  const response = await post(testCase.question);
  const body = await response.json().catch(() => ({}));

  if (body.mock) {
    console.error(
      "\nThe endpoint is in CHAT_MOCK mode — these evals assert on real\n" +
        "answers. Unset CHAT_MOCK, set GEMINI_API_KEY, restart, and rerun.\n",
    );
    process.exit(1);
  }
  if (!response.ok) {
    return { ...testCase, failures: [`HTTP ${response.status}: ${body.error}`], reply: "" };
  }

  const reply = body.reply ?? "";
  const failures = [];

  for (const pattern of testCase.mustInclude ?? []) {
    if (!pattern.test(reply)) failures.push(`missing ${pattern}`);
  }
  if (testCase.mustIncludeAny?.length) {
    if (!testCase.mustIncludeAny.some((p) => p.test(reply))) {
      failures.push(`matched none of ${testCase.mustIncludeAny.join(" | ")}`);
    }
  }
  for (const pattern of testCase.mustExclude ?? []) {
    if (pattern.test(reply)) failures.push(`must not contain ${pattern}`);
  }

  return { ...testCase, failures, reply, usage: body.usage };
}

/** Bounded concurrency — fast, without stampeding the API. */
async function pool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      for (;;) {
        const index = next++;
        if (index >= items.length) return;
        results[index] = await worker(items[index]);
      }
    }),
  );
  return results;
}

console.log(`\nEval set — ${selected.length} cases against ${ENDPOINT}\n`);

// Warm the cache with one request first. Fired concurrently from cold, every
// request in the first batch would pay the full uncached price for the prefix.
const [warmup, ...rest] = selected;
const results = [await run(warmup), ...(await pool(rest, 2, run))];

const byGroup = new Map();
for (const result of results) {
  const bucket = byGroup.get(result.group) ?? { pass: 0, fail: 0 };
  if (result.failures.length) bucket.fail += 1;
  else bucket.pass += 1;
  byGroup.set(result.group, bucket);
}

for (const [group, { pass, fail }] of byGroup) {
  const status = fail ? "FAIL" : "PASS";
  console.log(`  ${status}  ${group.padEnd(12)} ${pass}/${pass + fail}`);
}

const failed = results.filter((r) => r.failures.length);
if (failed.length) {
  console.log(`\n${failed.length} failing case${failed.length > 1 ? "s" : ""}:\n`);
  for (const result of failed) {
    console.log(`  [${result.group}] ${result.question}`);
    for (const reason of result.failures) console.log(`    ✗ ${reason}`);
    console.log(`    answer: ${result.reply.replace(/\n/g, " ").slice(0, 300)}\n`);
  }
}

// Token totals, measured. No dollar figure: free-tier inference costs
// nothing, so the number that matters is how many of the day's requests this
// run consumed.
const totals = results.reduce(
  (sum, r) => ({
    input: sum.input + (r.usage?.input ?? 0),
    output: sum.output + (r.usage?.output ?? 0),
    cached: sum.cached + (r.usage?.cached ?? 0),
  }),
  { input: 0, output: 0, cached: 0 },
);

console.log(
  `\n  ${results.length} requests · in ${totals.input} · out ${totals.output} · ` +
    `implicitly cached ${totals.cached}`,
);
console.log(
  `  free tier allows roughly 1,500 requests/day, so this run used about ` +
    `${((results.length / 1500) * 100).toFixed(1)}% of it\n`,
);

if (failed.length) process.exit(1);
console.log("All eval cases passed.\n");
