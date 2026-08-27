import { Architecture } from "@/components/Architecture";
import { Assistant } from "@/components/Assistant";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { ProjectBlock } from "@/components/ProjectBlock";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/primitives";
import { Skills } from "@/components/Skills";
import { assistant, projects } from "@/lib/content";

export default function Home() {
  const [propvexis, ...rest] = projects;

  return (
    <>
      <Nav />
      <main id="main">
        <Hero />

        <Section id="ask" index="01" label="Ask" title={assistant.title}>
          <div className="space-y-5">
            <p className="max-w-2xl text-fg-muted">{assistant.intro}</p>
            <Reveal>
              <Assistant />
            </Reveal>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
              <span>{assistant.disclaimer}</span>
              <span>
                {assistant.contactPrompt}{" "}
                <a
                  href="#contact"
                  className="underline-offset-4 transition-colors hover:text-fg hover:underline"
                >
                  {assistant.contactLink}
                </a>
                .
              </span>
            </p>
          </div>
        </Section>

        <Section id="work" index="02" label="Projects">
          <div className="space-y-6">
            <ProjectBlock project={propvexis}>
              <Architecture />
            </ProjectBlock>

            {rest.map((project) => (
              <ProjectBlock key={project.slug} project={project} />
            ))}
          </div>
        </Section>

        <Section id="experience" index="03" label="Experience">
          <Experience />
        </Section>

        <Section id="skills" index="04" label="Stack">
          <Skills />
        </Section>

        <Contact />
      </main>
    </>
  );
}
