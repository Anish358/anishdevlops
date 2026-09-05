import Link from "next/link";
import { editorial, projects } from "@/lib/content";

const { work } = editorial;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The work index. Hover behaviour — the tint, the 10px shift of the index and
 * the CTA, and the detail strip dropping open — is pure CSS in editorial.css,
 * so the whole section stays a server component.
 */
export function Work() {
  return (
    <section id="work" className="ed-section-work">
      <div className="ed-section-head">
        <span>{work.label}</span>
        <span>{pad(projects.length)} PROJECTS</span>
      </div>

      {projects.map((project, index) => {
        const href = project.caseStudy ?? project.links[0].href;
        const external = !project.caseStudy;

        const body = (
          <>
            <div className="ed-project-lead">
              <span className="ed-project-index">{pad(index + 1)}</span>
              <div className="ed-project-body">
                <h2 className="ed-project-title">{project.name.toUpperCase()}</h2>
                <div className="ed-project-cta">
                  {project.caseStudy ? work.caseStudyCta : work.projectCta}
                </div>
              </div>
            </div>
            <div className="ed-project-aside">
              <p className="ed-project-summary">{project.oneLiner}</p>
              <div className="ed-project-stack">{project.stackLine}</div>
              <div className="ed-project-detail" aria-hidden="true">
                <div className="ed-project-detail-inner">
                  <div className="ed-project-flow">
                    <span>{project.flow[0]}</span>
                    <span />
                    <span>{project.flow[1]}</span>
                    <span />
                    <span>{project.flow[2]}</span>
                  </div>
                  <div className="ed-project-stat">{project.stat}</div>
                </div>
              </div>
            </div>
          </>
        );

        return external ? (
          <a
            key={project.slug}
            href={href}
            className="ed-project"
            target="_blank"
            rel="noreferrer"
          >
            {body}
          </a>
        ) : (
          <Link key={project.slug} href={href} className="ed-project">
            {body}
          </Link>
        );
      })}

      <div className="ed-meta-row">
        <span>{work.archive}</span>
        <a href={work.archiveLink.href} target="_blank" rel="noreferrer">
          {work.archiveLink.label}
        </a>
      </div>
    </section>
  );
}
