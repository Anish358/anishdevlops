import { Fragment } from "react";
import Link from "next/link";
import {
  architecture,
  caseStudy,
  caseStudyChrome,
  caseStudyPages,
  pipeline,
  projects,
  type Project,
} from "@/lib/content";
import { DataPath } from "./DataPath";

const pad = (n: number) => String(n).padStart(2, "0");

type Slug = keyof typeof caseStudyPages;

/**
 * The case-study template.
 *
 * Every optional section renders only when the project has content for it, so
 * /luxora is the same page with the diagram, trade-offs, pipeline, runtime and
 * next-steps blocks absent rather than a second layout.
 */
export function CaseStudy({ slug }: { slug: Slug }) {
  const page = caseStudyPages[slug];
  const project = projects.find((p) => p.slug === slug) as Project;

  return (
    <>
      <section id="top" className="ed-cs-hero">
        <div className="ed-cs-hero-main">
          <div className="ed-hero-kicker">{page.eyebrow}</div>
          <h1 className="ed-cs-title">{page.title}</h1>
          <div className="ed-hero-rule">
            <span className="ed-hero-role">{page.subject}</span>
            <span className="ed-hero-hairline" aria-hidden="true" />
            {page.period ? <span className="ed-hero-locale">{page.period}</span> : null}
          </div>
          <p className="ed-cs-lede">{page.lede}</p>
        </div>

        <aside className="ed-cs-aside">
          {page.aside.map((block) => (
            <div key={block.label} className="ed-aside-block">
              <div className="ed-aside-label">{block.label}</div>
              {block.kind === "status" ? (
                <div className="ed-aside-status">
                  <span className="ed-dot" aria-hidden="true" />
                  {block.value}
                </div>
              ) : null}
              {block.kind === "link" ? (
                <a
                  className="ed-cs-aside-link"
                  href={block.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {block.value}
                </a>
              ) : null}
              {block.kind === "stack" ? (
                <div className="ed-cs-aside-stack">{project.stack.join(" · ")}</div>
              ) : null}
            </div>
          ))}
        </aside>
      </section>

      <section className="ed-cs-section">
        <div className="ed-cs-head">
          <span>{page.problem.label}</span>
          <span>{page.problem.counter}</span>
        </div>
        <div className="ed-cs-problem">
          <div className="ed-cs-problem-tag">{page.problem.tag}</div>
          <p className="ed-cs-problem-body">{project.problem}</p>
        </div>
      </section>

      {page.dataPath ? (
        <section className="ed-cs-section">
          <div className="ed-cs-head">
            <span>{page.dataPath.label}</span>
            <span>{page.dataPath.counter}</span>
          </div>
          <div className="ed-cs-figure">
            <div className="ed-cs-figure-caption">
              <span>{page.dataPath.figure}</span>
              <span>{page.dataPath.mode}</span>
            </div>
            <div className="ed-figure-scroll">
              <DataPath />
            </div>
            <p className="ed-cs-prose ed-cs-figure-note">{architecture.caption}</p>
          </div>
        </section>
      ) : null}

      <section className="ed-cs-section">
        <div className="ed-cs-head">
          <span>{page.features.label}</span>
          <span>{page.features.counter}</span>
        </div>
        <div>
          {project.features.map((feature, index) => (
            <div key={feature.title} className="ed-cs-feature">
              <div className="ed-cs-feature-index">{pad(index + 1)}</div>
              <div className="ed-cs-feature-body">
                <h2 className="ed-cs-feature-title">{feature.title}</h2>
                <p className="ed-cs-prose ed-cs-feature-text">{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {page.tradeOffs ? (
        <section className="ed-cs-section ed-cs-section--wide">
          <div className="ed-cs-head ed-cs-head--tighter">
            <span>{page.tradeOffs.label}</span>
            <span>{page.tradeOffs.counter}</span>
          </div>
          <div className="ed-cs-tradeoff-intro">
            <h2 className="ed-cs-tradeoff-headline">{page.tradeOffs.headline}</h2>
            <p className="ed-cs-prose ed-cs-tradeoff-blurb">{page.tradeOffs.blurb}</p>
          </div>
          <div className="ed-cs-tradeoff-grid">
            {caseStudy.decisions.map((decision, index) => (
              <div key={decision.title} className="ed-cs-tradeoff">
                <div className="ed-cs-tradeoff-kicker">
                  {pad(index + 1)} / {decision.kicker}
                </div>
                <h3 className="ed-cs-tradeoff-title">{decision.title}</h3>
                <p className="ed-cs-tradeoff-text">{decision.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {page.pipeline ? (
        <section className="ed-cs-section">
          <div className="ed-cs-head ed-cs-head--tight">
            <span>{page.pipeline.label}</span>
            <span>{page.pipeline.counter}</span>
          </div>
          <div className="ed-cs-pipeline">
            {pipeline.map((step, index) => (
              <Fragment key={step.stage}>
                {index > 0 ? (
                  <span className="ed-cs-stage-rule" aria-hidden="true" />
                ) : null}
                <span className="ed-cs-stage">
                  <span>{step.stage.toUpperCase()}</span>
                  <span className="ed-cs-stage-detail">{step.detail}</span>
                </span>
              </Fragment>
            ))}
          </div>
        </section>
      ) : null}

      {page.infrastructure ? (
        <section className="ed-cs-section">
          <div className="ed-cs-head ed-cs-head--tight">
            <span>{page.infrastructure.label}</span>
            <span>{page.infrastructure.counter}</span>
          </div>
          <div className="ed-cs-infra">
            <p className="ed-cs-prose ed-cs-infra-prose">{project.infra}</p>
            <div className="ed-cs-runtime">
              <div className="ed-cs-runtime-label">
                {page.infrastructure.runtimeLabel}
              </div>
              <div className="ed-cs-runtime-table">
                {page.infrastructure.runtime.map((row) => (
                  <div key={row.key} className="ed-cs-runtime-row">
                    <span className="ed-cs-runtime-key">{row.key}</span>
                    <span className={"accent" in row ? "ed-cs-runtime-accent" : undefined}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {page.whatsNext ? (
        <section className="ed-cs-section">
          <div className="ed-cs-head ed-cs-head--tight">
            <span>{page.whatsNext.label}</span>
            <span>{page.whatsNext.counter}</span>
          </div>
          <div>
            {caseStudy.next.map((item, index) => (
              <div key={item.label} className="ed-cs-next">
                <div className="ed-cs-next-index">{pad(index + 1)}</div>
                <div className="ed-cs-next-text">{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <nav className="ed-cs-outro" aria-label="Case study navigation">
        <div className="ed-meta-row">
          <span>{caseStudyChrome.end}</span>
          <Link href={caseStudyChrome.allProjects.href}>
            {caseStudyChrome.allProjects.label}
          </Link>
        </div>
        <Link href={page.nextProject.href} className="ed-cs-next-project">
          <div>
            <div className="ed-cs-next-project-kicker">{page.nextProject.kicker}</div>
            <div className="ed-cs-next-project-name">{page.nextProject.name}</div>
          </div>
          <div className="ed-cs-next-project-cta">{caseStudyChrome.viewProject}</div>
        </Link>
      </nav>
    </>
  );
}
