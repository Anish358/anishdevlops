import Link from "next/link";
import type { Project } from "@/lib/content";
import { Chip, Container, ExternalIcon } from "./primitives";

export function CaseStudyHeader({ project }: { project: Project }) {
  return (
    <section className="grain relative isolate overflow-hidden border-b border-border">
      <div
        className="grid-backdrop pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      />

      <Container className="pt-16 pb-20 sm:pt-20 sm:pb-24">
        <Link
          href="/#work"
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-fg-subtle uppercase transition-colors hover:text-fg"
        >
          ← back to projects
        </Link>

        <p className="mt-8 font-mono text-[11px] tracking-[0.14em] text-brand uppercase">
          {project.badge}
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          {project.name}
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{project.oneLiner}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong bg-surface/60 px-4 py-2.5 text-sm backdrop-blur-sm transition-colors hover:border-brand hover:text-brand-hi"
            >
              {link.label}
              <ExternalIcon className="size-3.5 text-fg-subtle transition-colors group-hover:text-brand-hi" />
            </a>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-1.5">
          {project.stack.map((tech) => (
            <Chip key={tech}>{tech}</Chip>
          ))}
        </div>
      </Container>
    </section>
  );
}
