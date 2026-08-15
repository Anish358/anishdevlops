import { site } from "@/lib/content";
import { ContactForm } from "./ContactForm";
import { Container } from "./primitives";
import { Reveal } from "./Reveal";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 border-t border-border py-24">
      <Container>
        <div className="mb-10 flex items-center gap-4">
          <span className="font-mono text-[11px] text-fg-subtle tabular-nums">04</span>
          <span className="font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
            Contact
          </span>
          <span className="hairline h-px flex-1" aria-hidden="true" />
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
          <Reveal>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Looking for a backend engineer who ships and runs it?
            </h2>
            <p className="mt-4 leading-relaxed text-fg-muted">
              I&rsquo;m {site.currently.toLowerCase()}, based in {site.location}, and
              open to backend and platform roles. Tell me what you&rsquo;re building.
            </p>

            <dl className="mt-8 space-y-4 border-t border-border pt-6">
              <div>
                <dt className="font-mono text-[10px] tracking-[0.18em] text-fg-subtle uppercase">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${site.email}`}
                    className="text-[15px] transition-colors hover:text-brand-hi"
                  >
                    {site.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.18em] text-fg-subtle uppercase">
                  Elsewhere
                </dt>
                <dd className="mt-1 flex items-center gap-4 text-[15px]">
                  <a
                    href={site.github}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-brand-hi"
                  >
                    GitHub
                  </a>
                  <a
                    href={site.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-brand-hi"
                  >
                    LinkedIn
                  </a>
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={80}>
            <ContactForm />
          </Reveal>
        </div>

        <footer className="mt-20 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-fg-subtle">
            {site.name} — {site.location}
          </p>
          <p className="font-mono text-[11px] text-fg-subtle">
            Usually replies within a day
          </p>
        </footer>
      </Container>
    </section>
  );
}
