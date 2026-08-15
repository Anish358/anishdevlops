import Link from "next/link";
import type { ReactNode } from "react";
import type { Project } from "@/lib/content";
import { ArrowIcon, Chip, ExternalIcon } from "./primitives";
import { Reveal } from "./Reveal";

/**
 * Homepage card: enough to decide whether to click, nothing more.
 * The problem statement, features, trade-offs and infra all live on the case
 * study — a card that says everything gives a reader no reason to go deeper.
 */
export function ProjectBlock({
  project,
  children,
}: {
  project: Project;
  children?: ReactNode;
}) {
  return (
    <Reveal className="card card-hover grain relative overflow-hidden p-6 sm:p-9">
      <span className="font-mono text-[11px] tracking-[0.14em] text-brand uppercase">
        {project.badge}
      </span>

      <h3 className="mt-4 text-3xl font-semibold tracking-tight">{project.name}</h3>
      <p className="mt-2 max-w-2xl text-fg-muted">{project.oneLiner}</p>

      {children}

      <div className="mt-8 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <Chip key={tech}>{tech}</Chip>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-border pt-6">
        {project.caseStudy ? (
          <Link
            href={project.caseStudy}
            className="group inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-hi"
          >
            Read the case study
            <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}

        {project.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex cursor-pointer items-center gap-1.5 text-sm text-fg transition-colors hover:text-brand-hi"
          >
            {link.label}
            <ExternalIcon className="size-3.5 text-fg-subtle transition-colors group-hover:text-brand-hi" />
          </a>
        ))}
      </div>
    </Reveal>
  );
}
