import { Architecture } from "@/components/Architecture";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { ProjectBlock } from "@/components/ProjectBlock";
import { Section } from "@/components/primitives";
import { Skills } from "@/components/Skills";
import { projects } from "@/lib/content";

export default function Home() {
  const [propvexis, ...rest] = projects;

  return (
    <>
      <Nav />
      <main id="main">
        <Hero />

        <Section id="work" index="01" label="Projects">
          <div className="space-y-6">
            <ProjectBlock project={propvexis}>
              <Architecture />
            </ProjectBlock>

            {rest.map((project) => (
              <ProjectBlock key={project.slug} project={project} />
            ))}
          </div>
        </Section>

        <Section id="experience" index="02" label="Experience">
          <Experience />
        </Section>

        <Section id="skills" index="03" label="Stack">
          <Skills />
        </Section>

        <Contact />
      </main>
    </>
  );
}
