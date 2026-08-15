import type { Metadata } from "next";
import Link from "next/link";
import { CaseStudyHeader } from "@/components/CaseStudyHeader";
import { Nav } from "@/components/Nav";
import { Container } from "@/components/primitives";
import { Reveal } from "@/components/Reveal";
import { projects, site } from "@/lib/content";

const project = projects.find((p) => p.slug === "luxora")!;

export const metadata: Metadata = {
  title: "Luxora — case study",
  description:
    "An e-commerce platform built end to end: a 300+ product catalogue, secure payments, an operator console with live analytics, and a Redis cache on the hot paths.",
  alternates: { canonical: `${site.url}/luxora` },
};

export default function LuxoraCaseStudy() {
  return (
    <>
      <Nav />

      <main id="main">
        <CaseStudyHeader project={project} />

        <Container className="py-20 sm:py-24">
          <Reveal>
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
              Why I built it
            </h2>
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-fg-muted">
              {project.problem}
            </p>
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

          <Reveal className="mt-20 border-t border-border pt-10">
            <p className="text-fg-muted">
              The code is on{" "}
              <a
                href="https://github.com/Anish358/luxora"
                target="_blank"
                rel="noreferrer"
                className="text-fg underline decoration-border-strong underline-offset-4 transition-colors hover:text-brand-hi"
              >
                GitHub
              </a>{" "}
              — or{" "}
              <Link
                href="/#contact"
                className="text-fg underline decoration-border-strong underline-offset-4 transition-colors hover:text-brand-hi"
              >
                get in touch
              </Link>{" "}
              and I&rsquo;ll walk you through it.
            </p>
          </Reveal>
        </Container>
      </main>
    </>
  );
}
