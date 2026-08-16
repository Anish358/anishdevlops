import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

/**
 * Spend controls for /api/chat.
 *
 * This is a public endpoint that costs money on every request, so it needs a
 * ceiling before it is public, not after. Counters live in Upstash rather than
 * in process memory because serverless invocations do not share memory — an
 * in-process counter resets constantly and enforces nothing.
 *
 * Two layers, doing different jobs:
 *   - per-IP limits stop one visitor monopolising or probing the endpoint
 *   - a global daily cap is the actual spend ceiling, and holds even if
 *     someone arrives from a thousand addresses
 */

/**
 * Overridable by environment so the ceiling can be tuned from the Vercel
 * dashboard without shipping code, and lowered locally to exercise the
 * refusal paths cheaply. The defaults are the production values.
 */
const num = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const LIMITS = {
  ipPerHour: num(process.env.CHAT_IP_PER_HOUR, 10),
  ipPerDay: num(process.env.CHAT_IP_PER_DAY, 30),
  /** ~500 answers/day is roughly $3 at Sonnet 5's promotional rate. */
  globalPerDay: num(process.env.CHAT_GLOBAL_PER_DAY, 500),
} as const;

/**
 * Shared across invocations on a warm instance so an already-blocked visitor
 * costs no Redis round trip. Per-instance, so it is an optimisation only —
 * Redis stays the source of truth.
 */
const ephemeralCache = new Map<string, number>();

/**
 * Built on first use, never at module scope.
 *
 * Vercel redacts sensitive environment variables during the build, so a client
 * constructed at import time receives the literal string "[REDACTED]" while
 * Next collects page data — and the Upstash client validates its URL eagerly,
 * which fails the build. It passed locally because .env.local holds real
 * values, so nothing catches this except deploying. Anything constructed from
 * a secret belongs behind a lazy getter for the same reason.
 */
let limiters: {
  ipHourly: Ratelimit;
  ipDaily: Ratelimit;
  globalDaily: Ratelimit;
} | null = null;

function getLimiters() {
  if (limiters) return limiters;

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const sliding = (tokens: number, window: "1 h" | "1 d", prefix: string) =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix,
      analytics: false,
      ephemeralCache,
    });

  limiters = {
    // Sliding windows for per-IP: a fixed window lets someone send the hour's
    // whole allowance at 10:59 and the next one at 11:00.
    ipHourly: sliding(LIMITS.ipPerHour, "1 h", "chat:ip:h"),
    ipDaily: sliding(LIMITS.ipPerDay, "1 d", "chat:ip:d"),
    // The global cap is a fixed window on purpose: "500 answers a day, resets
    // at midnight UTC" is a ceiling you can reason about and explain, which
    // matters more here than smoothing the boundary.
    globalDaily: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(LIMITS.globalPerDay, "1 d"),
      prefix: "chat:global",
      analytics: false,
    }),
  };
  return limiters;
}

/**
 * Rate limiting needs a stable per-visitor key, but the plan says no IP
 * addresses are stored. Hashing satisfies both: the same visitor maps to the
 * same bucket, and a Redis dump contains no addresses. Truncated because 16
 * hex characters is far beyond collision risk at this traffic.
 */
function visitorKey(request: Request): string {
  // Vercel sets both; the first entry of x-forwarded-for is the client.
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    // Local dev has neither, so everything shares one bucket. Fine — the
    // limits exist for the deployed site.
    "local";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export type Decision =
  | { ok: true }
  | { ok: false; error: string; status: number; retryAfter?: number };

const secondsUntil = (reset: number) =>
  Math.max(1, Math.ceil((reset - Date.now()) / 1000));

/**
 * Checks every limit, cheapest and most-likely-to-trip first.
 *
 * Order matters: each check consumes from its own budget, so per-IP runs
 * before the global cap. The other way round, one abusive visitor would burn
 * the global allowance for everybody without ever being served.
 */
export async function checkLimits(request: Request): Promise<Decision> {
  const key = visitorKey(request);

  try {
    const { ipHourly, ipDaily, globalDaily } = getLimiters();

    const hourly = await ipHourly.limit(key);
    if (!hourly.success) {
      return {
        ok: false,
        status: 429,
        retryAfter: secondsUntil(hourly.reset),
        error:
          "That's a lot of questions in a short time. Try again a bit later, or use the contact form to reach Anish directly.",
      };
    }

    const daily = await ipDaily.limit(key);
    if (!daily.success) {
      return {
        ok: false,
        status: 429,
        retryAfter: secondsUntil(daily.reset),
        error:
          "You've reached the daily limit for questions. Try again tomorrow, or use the contact form to reach Anish directly.",
      };
    }

    const global = await globalDaily.limit("all");
    if (!global.success) {
      console.warn("[chat] global daily cap reached");
      return {
        ok: false,
        status: 503,
        retryAfter: secondsUntil(global.reset),
        error:
          "The assistant has answered as many questions as it can today. Please use the contact form to reach Anish directly.",
      };
    }

    return { ok: true };
  } catch (error) {
    // Fail CLOSED. If the counters are unreachable there is no ceiling, and an
    // unbounded public endpoint that spends money is a worse failure than a
    // temporarily unavailable one. The visitor still gets an honest message
    // and a route to a human.
    console.error("[chat] rate limiter unreachable — refusing to serve", error);
    return {
      ok: false,
      status: 503,
      error:
        "The assistant is unavailable right now. Please use the contact form to reach Anish directly.",
    };
  }
}
