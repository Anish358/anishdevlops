import { site } from "@/lib/content";
import { ArrowIcon, Container } from "./primitives";
import { Reveal } from "./Reveal";
import { SpecCard } from "./SpecCard";
import { TickChart } from "./TickChart";

export function Hero() {
  return (
    <section id="top" className="grain relative isolate overflow-hidden">
      {/* engineering grid, fading out downward */}
      <div
        className="grid-backdrop pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      />

      {/* ambient equity curve, bled off the bottom edge */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[42%] opacity-70 [mask-image:linear-gradient(to_bottom,transparent,#000_55%)]"
        aria-hidden="true"
      >
        <TickChart />
      </div>

      <Container className="pt-20 pb-28 sm:pt-28 sm:pb-36">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
          <div>
            <Reveal>
              <p className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 font-mono text-[11px] text-fg-muted backdrop-blur-sm">
                <span
                  className="size-1.5 animate-[blink_2.4s_ease-in-out_infinite] rounded-full bg-brand"
                  aria-hidden="true"
                />
                {site.availability}
              </p>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-6xl">
                I build backends
                <br />
                <span className="text-fg-muted">and run them</span>
                <span className="text-brand">.</span>
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-8 max-w-xl leading-relaxed text-fg-muted">{site.intro}</p>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-9">
                <a
                  href="#work"
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hi"
                >
                  See the systems
                  <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={260} className="lg:mt-16">
            <SpecCard />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
