"use client";

import Link from "next/link";
import { caseStudyChrome, editorial } from "@/lib/content";
import { useAsk } from "./AskProvider";

/**
 * The reduced inner-page header: a back link and a chapter marker in place of
 * the homepage's wordmark and full nav, but the same ⌘ ASK button — so the
 * palette works here too.
 */
export function CaseStudyHeader({ chapter }: { chapter: string }) {
  const { openPalette } = useAsk();

  return (
    <header className="ed-header">
      <div className="ed-cs-identity">
        <Link href="/" className="ed-brand">
          {caseStudyChrome.back}
        </Link>
        <span className="ed-cs-chapter">{chapter}</span>
      </div>
      <nav className="ed-nav" aria-label="Main">
        {caseStudyChrome.nav.map((item) => (
          <Link key={item.href} href={item.href} className="ed-nav-link">
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={openPalette}
          className="ed-ask-button"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <span className="ed-symbol" aria-hidden="true">
            ⌘
          </span>{" "}
          {editorial.askShortcut}
        </button>
      </nav>
    </header>
  );
}
