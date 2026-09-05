import type { Metadata } from "next";
import { AskProvider } from "@/components/editorial/AskProvider";
import { CaseStudy } from "@/components/editorial/CaseStudy";
import { CaseStudyHeader } from "@/components/editorial/CaseStudyHeader";
import { CommandPalette } from "@/components/editorial/CommandPalette";
import { Footer } from "@/components/editorial/Footer";
import { caseStudyPages, site } from "@/lib/content";

const page = caseStudyPages.luxora;

export const metadata: Metadata = {
  title: "Luxora — case study",
  description:
    "Luxora: a full e-commerce platform with a 300-product catalogue, secure payments, an operator console with live analytics, and Redis caching that cut response times by roughly 30%.",
  alternates: { canonical: `${site.url}/luxora` },
};

export default function LuxoraCaseStudy() {
  return (
    <AskProvider>
      <div className="editorial">
        <CaseStudyHeader chapter={page.chrome} />
        <main id="main">
          <CaseStudy slug="luxora" />
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
