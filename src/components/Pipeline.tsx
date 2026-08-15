import { pipeline } from "@/lib/content";

/**
 * The actual GitHub Actions stages behind app.propvexis.com, drawn as a
 * pipeline. Doubles as the visual proof of the "I run what I ship" claim.
 */
export function Pipeline() {
  return (
    <div className="card mt-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span
          className="size-1.5 animate-[blink_2.4s_ease-in-out_infinite] rounded-full bg-brand"
          aria-hidden="true"
        />
        <span className="font-mono text-[11px] tracking-[0.14em] text-fg-subtle uppercase">
          push to main → production
        </span>
      </div>

      <ol className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
        {pipeline.map((step, i) => (
          <li
            key={step.stage}
            className="flex flex-1 items-center gap-3 px-4 py-4 sm:flex-col sm:items-start sm:gap-1.5"
          >
            <span className="font-mono text-[10px] text-fg-subtle tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex items-baseline gap-2 sm:flex-col sm:gap-1">
              <span className="font-mono text-[13px] text-brand-hi">{step.stage}</span>
              <span className="text-[12px] text-fg-subtle">{step.detail}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
