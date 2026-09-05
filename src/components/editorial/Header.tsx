"use client";

import { editorial } from "@/lib/content";
import { useAsk } from "./AskProvider";

export function Header() {
  const { openPalette } = useAsk();

  return (
    <header className="ed-header">
      <a href="#top" className="ed-brand">
        {editorial.brand}
      </a>
      <nav className="ed-nav" aria-label="Main">
        {editorial.nav.map((item) => (
          <a key={item.href} href={item.href} className="ed-nav-link">
            {item.label}
          </a>
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
