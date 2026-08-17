/**
 * Phase 3 verification for /api/chat's spend controls.
 *
 * Proves the limiter refuses, rather than assuming it does. Run it against a
 * dev server in MOCK mode with small limits, so every probe is free:
 *
 *   # in .env.local
 *   CHAT_MOCK=1
 *   CHAT_IP_PER_HOUR=3
 *   CHAT_GLOBAL_PER_DAY=5
 *
 *   pnpm dev
 *   pnpm verify:limits
 *
 * It talks to real Upstash, so it is testing the counters you ship with — not
 * a stub. Afterwards, clear those three variables and restart to get the
 * production limits back.
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL.replace(/\/$/, "")}/api/chat`;

const IP_PER_HOUR = Number(process.env.CHAT_IP_PER_HOUR ?? 10);

const failures = [];
const check = (label, condition, detail) => {
  console.log(`${condition ? "  PASS" : "  FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!condition) failures.push(label);
};

/** A distinct address per run, so a rerun isn't blocked by the previous one. */
const spoofIp = () =>
  `203.0.113.${Math.floor(Math.random() * 200) + 1}.${Date.now() % 1000}`;

async function ask(ip) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ messages: [{ role: "user", content: "What has he built?" }] }),
  });
  return {
    status: response.status,
    retryAfter: response.headers.get("retry-after"),
    body: await response.json().catch(() => ({})),
  };
}

console.log(`\nVerifying spend controls on ${ENDPOINT}`);
console.log(`Per-IP hourly limit under test: ${IP_PER_HOUR}\n`);

if (IP_PER_HOUR > 12) {
  console.error(
    `Refusing to run: CHAT_IP_PER_HOUR is ${IP_PER_HOUR}, so this would send\n` +
      `${IP_PER_HOUR + 1} requests. Lower it in .env.local (see the header of\n` +
      `this file) and restart the dev server.\n`,
  );
  process.exit(1);
}

console.log("Per-IP limit");

const visitor = spoofIp();
const allowed = [];
for (let i = 0; i < IP_PER_HOUR; i += 1) allowed.push(await ask(visitor));

check(
  `the first ${IP_PER_HOUR} requests are served`,
  allowed.every((r) => r.status === 200),
  allowed.map((r) => r.status).join(", "),
);

const blocked = await ask(visitor);
check("the next one is refused", blocked.status === 429, `status ${blocked.status}`);
check(
  "it says so honestly and points at the contact form",
  /contact form/i.test(blocked.body.error ?? ""),
  JSON.stringify(blocked.body.error ?? ""),
);
check(
  "it sends Retry-After",
  Number(blocked.retryAfter) > 0,
  `Retry-After: ${blocked.retryAfter}`,
);

console.log("\nPer-visitor isolation");

// The limit must be per visitor, not a global counter wearing a per-IP label.
const neighbour = await ask(spoofIp());
check(
  "a different visitor is unaffected",
  neighbour.status === 200,
  `status ${neighbour.status}`,
);

console.log("\nGlobal cap");

const globalLimit = Number(process.env.CHAT_GLOBAL_PER_DAY ?? 0);
if (!globalLimit || globalLimit > 20) {
  console.log(
    "  SKIP  set CHAT_GLOBAL_PER_DAY to something small (e.g. 5) to exercise this",
  );
} else {
  // Fresh IPs every time, so only the global counter can stop us.
  let capped = null;
  for (let i = 0; i < globalLimit + 2 && !capped; i += 1) {
    const result = await ask(spoofIp());
    if (result.status !== 200) capped = result;
  }
  check("the global cap eventually refuses everyone", capped !== null, capped ? `status ${capped.status}` : "never refused");
  check(
    "and degrades to the contact form",
    /contact form/i.test(capped?.body?.error ?? ""),
    JSON.stringify(capped?.body?.error ?? ""),
  );
}

if (failures.length) {
  console.error(`\nFAILED: ${failures.join("; ")}\n`);
  process.exit(1);
}
console.log("\nAll assertions passed.\n");
