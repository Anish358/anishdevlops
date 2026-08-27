import { Redis } from "@upstash/redis";

/**
 * Logs the questions visitors ask — and nothing else.
 *
 * The payoff is the point of Phase 6: a log of what recruiters actually ask is
 * a list of what the CV and the site are failing to answer on their own. If
 * "what's his notice period" shows up thirty times, that belongs on the page,
 * not just in the assistant.
 *
 * What is deliberately NOT stored: no IP address, no answers, no conversation
 * history, no session or visitor identifier. There is nothing here to join
 * rows together with, so the log cannot be turned back into a person.
 */

const KEY = "chat:questions";
/** Enough to spot a pattern; small enough that the log never becomes a corpus. */
const KEEP = 1000;

/**
 * The question is free text, so a visitor may put their own contact details in
 * it ("I'm hiring for X, mail me at ..."). "No PII" has to survive that, so
 * anything that looks like a way to contact a person is removed before the
 * question is written down.
 */
export function redact(question: string): string {
  return question
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .replace(/\bhttps?:\/\/\S+/gi, "[link]")
    .trim();
}

let redis: Redis | null = null;

/**
 * Lazy for the same reason as the rate limiter: sensitive environment
 * variables are redacted during the Vercel build, so a client built at module
 * scope is constructed with "[REDACTED]" and can fail the build.
 */
function getRedis(): Redis {
  redis ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return redis;
}

/**
 * Fire-and-forget from the caller's perspective — invoke it inside `after()`
 * so it runs once the answer has already been sent. Never throws: a logging
 * failure must not cost a visitor their answer.
 */
export async function logQuestion(question: string): Promise<void> {
  try {
    const entry = JSON.stringify({
      q: redact(question),
      at: new Date().toISOString(),
    });
    const client = getRedis();
    await client.lpush(KEY, entry);
    await client.ltrim(KEY, 0, KEEP - 1);
  } catch (error) {
    console.error("[chat] could not log question", error);
  }
}
