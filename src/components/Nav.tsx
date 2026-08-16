import Link from "next/link";
import { site } from "@/lib/content";
import { Container } from "./primitives";

// Root-relative so they also work from /propvexis, not just the home page.
const links = [
  { href: "/#ask", label: "Ask" },
  { href: "/#work", label: "Projects" },
  { href: "/#experience", label: "Experience" },
  { href: "/#skills", label: "Skills" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-md">
      <Container>
        <nav className="flex h-14 items-center justify-between" aria-label="Main">
          <Link
            href="/"
            className="font-mono text-sm font-medium tracking-tight transition-colors hover:text-brand-hi"
          >
            anish<span className="text-brand">.</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <ul className="hidden items-center gap-1 sm:flex">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-md px-2.5 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={site.resume}
              className="ml-1 cursor-pointer rounded-md border border-border-strong px-3 py-1.5 text-sm text-fg transition-colors hover:border-brand hover:text-brand-hi"
            >
              Resume
            </a>
          </div>
        </nav>
      </Container>
    </header>
  );
}
