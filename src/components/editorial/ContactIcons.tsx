import { editorial } from "@/lib/content";

const { links } = editorial.contact;

/**
 * Inline SVG, never a font or emoji. The two brand marks are filled because
 * that's how they're drawn; the envelope is stroked to sit at the same weight.
 */
const ICONS: Record<string, React.ReactNode> = {
  email: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4.5" width="20" height="15" rx="1.5" />
      <path d="M2.8 5.8 12 12.7l9.2-6.9" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.881 3.87 6 2.5 6S.02 4.881.02 3.5C.02 2.12 1.13 1 2.5 1s2.48 1.12 2.48 2.5zM.29 8h4.42v14H.29V8zm7.44 0h4.24v1.914h.06c.59-1.117 2.03-2.294 4.18-2.294 4.47 0 5.29 2.942 5.29 6.769V22h-4.42v-6.72c0-1.602-.03-3.664-2.23-3.664-2.24 0-2.58 1.75-2.58 3.552V22H7.73V8z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
};

export function ContactIcons({ className = "" }: { className?: string }) {
  return (
    <div className={`ed-contact-icons ${className}`.trim()}>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="ed-contact-icon"
          aria-label={`${link.label} — ${link.value}`}
          {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {ICONS[link.id]}
        </a>
      ))}
    </div>
  );
}
