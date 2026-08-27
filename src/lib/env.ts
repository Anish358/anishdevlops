/**
 * Reads an environment variable, stripping surrounding quotes and whitespace.
 *
 * Upstash — like most dashboards — hands you a snippet in the form
 * `KEY="value"` to paste into .env. dotenv strips those quotes when it loads
 * the file, so a quoted value behaves perfectly locally and stays invisible
 * until something copies the raw line somewhere that does NOT strip them.
 *
 * That took production down once: the Redis REST URL reached Vercel as
 * `"https://…"` with the quotes included, so the Upstash client rejected it
 * ("You should pass a URL starting with https"), the rate limiter failed
 * closed, and every visitor got the contact-form fallback. Local builds and
 * local runtime were fine throughout, because dotenv had already stripped
 * the quotes here.
 *
 * Reading through this helper makes a quoted value harmless wherever it comes
 * from. The lookup is dynamic (`process.env[name]`) rather than a static
 * `process.env.NAME`, which also guarantees the true runtime value is read
 * rather than anything captured at build time.
 */
export function env(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;

  const unquoted = raw.trim().replace(/^(['"])([\s\S]*)\1$/, "$2").trim();
  return unquoted === "" ? undefined : unquoted;
}

/** Same, but throws when absent — for values a code path cannot run without. */
export function requireEnv(name: string): string {
  const value = env(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}
