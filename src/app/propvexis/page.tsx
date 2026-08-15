import type { Metadata } from "next";
import Link from "next/link";
import { Architecture } from "@/components/Architecture";
import { CaseStudyHeader } from "@/components/CaseStudyHeader";
import { Nav } from "@/components/Nav";
import { Pipeline } from "@/components/Pipeline";
import { Container } from "@/components/primitives";
import { Reveal } from "@/components/Reveal";
import { caseStudy, projects, site } from "@/lib/content";

const project = projects.find((p) => p.slug === "propvexis")!;

export const metadata: Metadata = {
  title: "PropVexis — case study",
  description:
    "How PropVexis works: idempotent real-time ingestion from a MetaTrader 5 agent, a configurable prop-firm rule engine, analytics in PostgreSQL behind an invalidating Redis cache, and the AWS infrastructure it runs on.",
  alternates: { canonical: `${site.url}/propvexis` },
};

export default function PropVexisCaseStudy() {
  return (
    <>
      <Nav />

      <main id="main">
        <CaseStudyHeader project={project} />

        <Container className="py-20 sm:py-24">
          <Reveal>
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
              The problem
            </h2>
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-fg-muted">
              {project.problem}
            </p>
          </Reveal>

          <Reveal className="mt-20">
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
              How it fits together
            </h2>
            <Architecture />
          </Reveal>

          <Reveal className="mt-20">
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
              What I built
            </h2>
            <ul className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {project.features.map((feature) => (
                <li key={feature.title} className="border-t border-border pt-4">
                  <h3 className="font-mono text-[12.5px] tracking-wide text-brand-hi">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted">
                    {feature.body}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-20">
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
              Decisions and trade-offs
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-subtle">
              The interesting part of a system isn&rsquo;t what it does, it&rsquo;s what
              it gave up. Each of these had a cheaper option I didn&rsquo;t take.
            </p>

            <ol className="mt-8 space-y-px overflow-hidden rounded-xl border border-border">
              {caseStudy.decisions.map((decision, i) => (
                <li
                  key={decision.title}
                  className="bg-surface p-6 transition-colors hover:bg-surface-2 sm:p-7"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[11px] text-fg-subtle tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[17px] font-medium">{decision.title}</h3>
                      <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-fg-muted">
                        {decision.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal className="mt-20">
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
              Shipping it
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
              {project.infra}
            </p>
            <Pipeline />
          </Reveal>

          <Reveal className="mt-20">
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
              What I&rsquo;d change next
            </h2>
            <ul className="mt-6 space-y-4">
              {caseStudy.next.map((item) => (
                <li
                  key={item}
                  className="relative max-w-2xl border-l-2 border-border-strong pl-5 text-[15px] leading-relaxed text-fg-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-20 border-t border-border pt-10">
            <p className="text-fg-muted">
              Happy to walk through any of this in detail —{" "}
              <Link
                href="/#contact"
                className="text-fg underline decoration-border-strong underline-offset-4 transition-colors hover:text-brand-hi"
              >
                get in touch
              </Link>
              .
            </p>
          </Reveal>
        </Container>
      </main>
    </>
  );
}
