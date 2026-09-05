import type { Metadata } from "next";
import { AskProvider } from "@/components/editorial/AskProvider";
import { CaseStudy } from "@/components/editorial/CaseStudy";
import { CaseStudyHeader } from "@/components/editorial/CaseStudyHeader";
import { CommandPalette } from "@/components/editorial/CommandPalette";
import { Footer } from "@/components/editorial/Footer";
import { caseStudyPages, site } from "@/lib/content";

const page = caseStudyPages.propvexis;

export const metadata: Metadata = {
  title: "PropVexis — case study",
  description:
    "How PropVexis works: idempotent real-time ingestion from a MetaTrader 5 agent, a configurable prop-firm rule engine, analytics in PostgreSQL behind an invalidating Redis cache, and the AWS infrastructure it runs on.",
  alternates: { canonical: `${site.url}/propvexis` },
};

export default function PropVexisCaseStudy() {
  return (
    <AskProvider>
      <div className="editorial">
        <CaseStudyHeader chapter={page.chrome} />
        <main id="main">
          <CaseStudy slug="propvexis" />
        </main>
        <Footer />
        <CommandPalette
          suggestions={page.palette.suggestions}
          placeholder={page.palette.placeholder}
        />
      </div>
    </AskProvider>
  );
}
