import { spec } from "@/lib/content";
import { ExternalIcon } from "./primitives";

/**
 * The hero's right column. A manifest of facts rather than a paragraph about
 * himself — scannable in five seconds, and on-concept for a site that presents
 * itself as a running system.
 */
export function SpecCard() {
  return (
    <div className="card bg-surface/70 backdrop-blur-md">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3">
        <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
          spec
        </span>
      </div>

      <dl className="divide-y divide-border">
        {spec.map((row) => (
          <div
            key={row.key}
            className="flex items-baseline gap-4 px-5 py-3 sm:gap-6"
          >
            <dt className="w-[4.5rem] shrink-0 font-mono text-[10px] tracking-[0.14em] text-fg-subtle uppercase">
              {row.key}
            </dt>
            <dd className="text-[13.5px] leading-snug text-fg-muted">
              {"href" in row && row.href ? (
                <a
                  href={row.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 text-fg transition-colors hover:text-brand-hi"
                >
                  {row.value}
                  <ExternalIcon className="size-3 text-fg-subtle transition-colors group-hover:text-brand-hi" />
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
