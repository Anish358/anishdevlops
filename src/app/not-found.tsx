import Link from "next/link";
import { CaseStudyHeader } from "@/components/editorial/CaseStudyHeader";
import { AskProvider } from "@/components/editorial/AskProvider";
import { CommandPalette } from "@/components/editorial/CommandPalette";
import { Footer } from "@/components/editorial/Footer";
import { editorial } from "@/lib/content";

const copy = editorial.notFound;

/**
 * 404, in the same system as everything else. Uses the case-study chrome —
 * a back link and a chapter marker — because that is what an inner page wears.
 */
export default function NotFound() {
  return (
    <AskProvider>
      <div className="editorial">
        <CaseStudyHeader chapter={copy.chapter} />
        <main id="main">
          <section className="ed-cs-hero">
            <div className="ed-cs-hero-main">
              <div className="ed-hero-kicker">{copy.eyebrow}</div>
              <h1 className="ed-cs-title">
                {copy.title[0]}
                <br />
                {copy.title[1]}
              </h1>
              <div className="ed-hero-rule">
                <span className="ed-hero-role">{copy.status}</span>
                <span className="ed-hero-hairline" aria-hidden="true" />
              </div>
              <p className="ed-cs-lede">{copy.lede}</p>
            </div>

            <aside className="ed-cs-aside">
              {copy.links.map((link) => (
                <div key={link.href} className="ed-aside-block">
                  <Link href={link.href} className="ed-cs-aside-link">
                    {link.label}
                  </Link>
                </div>
              ))}
            </aside>
          </section>
        </main>
        <Footer />
        <CommandPalette />
      </div>
    </AskProvider>
  );
}
