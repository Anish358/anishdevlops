import { About } from "@/components/editorial/About";
import { Ask } from "@/components/editorial/Ask";
import { AskProvider } from "@/components/editorial/AskProvider";
import { CommandPalette } from "@/components/editorial/CommandPalette";
import { Contact } from "@/components/editorial/Contact";
import { Currently } from "@/components/editorial/Currently";
import { Experience } from "@/components/editorial/Experience";
import { Figure } from "@/components/editorial/Figure";
import { Footer } from "@/components/editorial/Footer";
import { Header } from "@/components/editorial/Header";
import { Hero } from "@/components/editorial/Hero";
import { Stack } from "@/components/editorial/Stack";
import { Work } from "@/components/editorial/Work";

/**
 * The editorial homepage. Layout and every measurement come from
 * editorial-design-system/project/"Anish Shejawale - Homepage.dc.html";
 * the styles live in src/app/editorial.css, scoped to `.editorial`.
 */
export default function Home() {
  return (
    <AskProvider>
      <div className="editorial">
        <Header />
        <main id="main">
          <Hero />
          <Figure />
          <Work />
          <Experience />
          <Stack />
          <About />
          <Currently />
          <Ask />
          <Contact />
        </main>
        <Footer />
        <CommandPalette />
      </div>
    </AskProvider>
  );
}
