/**
 * Reads back the questions visitors have asked.
 *
 * This is the payoff for logging at all: the questions people actually ask are
 * the ones the CV and the site are failing to answer on their own. If "notice
 * period" keeps coming up, that belongs on the page.
 *
 *   pnpm questions          # 40 most recent
 *   pnpm questions 200      # more
 *
 * Reads UPSTASH_* straight out of .env.local, so it needs no dev server.
 */

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, "")];
    }),
);

const URL_BASE = env.UPSTASH_REDIS_REST_URL;
const TOKEN = env.UPSTASH_REDIS_REST_TOKEN;
if (!URL_BASE || !TOKEN) {
  console.error("UPSTASH_REDIS_REST_URL / _TOKEN missing from .env.local");
  process.exit(1);
}

const limit = Number(process.argv[2] ?? 40);

const response = await fetch(`${URL_BASE}/lrange/chat:questions/0/${limit - 1}`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const { result } = await response.json();

if (!result?.length) {
  console.log("\nNo questions logged yet.\n");
  process.exit(0);
}

const entries = result
  .map((raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

console.log(`\n${entries.length} most recent questions\n`);
for (const { q, at } of entries) {
  console.log(`  ${at.slice(0, 16).replace("T", " ")}  ${q}`);
}

// Repeats are the signal worth acting on — one person asking is curiosity,
// five people asking is a gap on the page.
const counts = new Map();
for (const { q } of entries) {
  const key = q.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
const repeated = [...counts.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);

if (repeated.length) {
  console.log(`\nAsked more than once\n`);
  for (const [q, n] of repeated) console.log(`  ${String(n).padStart(3)}x  ${q}`);
}
console.log("");
