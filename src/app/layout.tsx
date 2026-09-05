import type { Metadata } from "next";
import { Archivo, Space_Mono } from "next/font/google";
import { site } from "@/lib/content";
import "./globals.css";

/* Archivo for display and prose, Space Mono for labels and numbers. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const description = `${site.role} in ${site.location}. ${site.intro}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}`,
    template: `%s — ${site.name}`,
  },
  description,
  keywords: [
    "Anish Shejawale",
    "backend developer",
    "Node.js",
    "Django",
    "PostgreSQL",
    "AWS",
    "Bengaluru",
  ],
  authors: [{ name: site.name, url: site.url }],
  openGraph: {
    type: "website",
    url: site.url,
    title: `${site.name} — ${site.role}`,
    description,
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: site.url },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${spaceMono.variable}`}>
      <body>
        <a href="#main" className="ed-skip">
          SKIP TO CONTENT
        </a>
        {children}
        <script
          type="application/ld+json"
          // Structured data so a recruiter's Google search surfaces the right person.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: site.name,
              jobTitle: site.role,
              url: site.url,
              email: `mailto:${site.email}`,
              address: { "@type": "PostalAddress", addressLocality: site.location },
              sameAs: [site.github, site.linkedin],
            }),
          }}
        />
      </body>
    </html>
  );
}
