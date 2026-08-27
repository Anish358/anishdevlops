/**
 * Runs the eval set against a live /api/chat and exits non-zero on any
 * failure, so it can gate a deploy.
 *
 *   pnpm dev                 # in one terminal
 *   pnpm eval                # in another
 *   BASE_URL=https://... pnpm eval
 *   pnpm eval injection      # just one group
 *
 * Costs roughly $0.20 a run at Sonnet 5's promotional rate, and prints what it
 * actually spent so that stays honest rather than estimated.
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

async function run(testCase) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": visitor() },
    body: JSON.stringify({
      messages: [{ role: "user", content: testCase.question }],
    }),
  });
  const body = await response.json().catch(() => ({}));

  if (body.mock) {
    console.error(
      "\nThe endpoint is in CHAT_MOCK mode — these evals assert on real\n" +
        "answers. Unset CHAT_MOCK, restart the dev server, and rerun.\n",
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
const results = [await run(warmup), ...(await pool(rest, 4, run))];

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

// Spend, measured rather than guessed. Promotional Sonnet 5 rates; cache reads
// bill at ~10% of input, cache writes at 1.25x.
const totals = results.reduce(
  (sum, r) => ({
    input: sum.input + (r.usage?.input ?? 0),
    output: sum.output + (r.usage?.output ?? 0),
    cacheWrite: sum.cacheWrite + (r.usage?.cacheWrite ?? 0),
    cacheRead: sum.cacheRead + (r.usage?.cacheRead ?? 0),
  }),
  { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 },
);
const cost =
  (totals.input * 2 + totals.cacheWrite * 2 * 1.25 + totals.cacheRead * 0.2 + totals.output * 10) /
  1_000_000;

console.log(
  `\n  cache reads ${totals.cacheRead} · writes ${totals.cacheWrite} · ` +
    `uncached in ${totals.input} · out ${totals.output}`,
);
console.log(`  this run cost about $${cost.toFixed(3)}\n`);

if (failed.length) process.exit(1);
console.log("All eval cases passed.\n");
