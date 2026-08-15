import { experience } from "@/lib/content";
import { Reveal } from "./Reveal";

export function Experience() {
  return (
    <ol className="space-y-10">
      {experience.map((job, index) => (
        <Reveal key={job.company} delay={index * 60}>
          <li className="border-l border-border pl-6 sm:pl-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <h3 className="font-medium text-fg">
                {job.company}
                {"note" in job && job.note ? (
                  <span className="ml-2 font-normal text-[13px] text-fg-subtle">
                    ({job.note})
                  </span>
                ) : null}
              </h3>
              <span className="font-mono text-[11px] whitespace-nowrap text-fg-subtle tabular-nums">
                {job.period}
              </span>
            </div>

            <p className="mt-0.5 text-sm text-brand">{job.role}</p>

            <ul className="mt-4 space-y-2.5">
              {job.points.map((point) => (
                <li
                  key={point}
                  className="relative pl-4 text-[15px] leading-relaxed text-fg-muted before:absolute before:top-[0.6em] before:left-0 before:size-1 before:rounded-full before:bg-border-strong"
                >
                  {point}
                </li>
              ))}
            </ul>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}
