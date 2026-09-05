import { ImageResponse } from "next/og";
import { editorial, site } from "@/lib/content";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The editorial palette, flattened — Satori doesn't resolve oklch or var(). */
const PAPER = "#F5F4F0";
const INK = "#111111";
const INK_2 = "#35322D";
const MUTED = "#6E6B65";
const ACCENT = "#1B3BD9";
const RULE = "rgba(17,17,17,0.14)";

/**
 * Generated at build time rather than exported from a design tool, so it can
 * never drift from the copy in content.ts. No external font fetch — a failed
 * font request during a deploy would break the build for a social preview,
 * which also means the type here approximates Archivo rather than being it.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          color: INK,
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            letterSpacing: "0.2em",
            color: MUTED,
          }}
        >
          <div style={{ display: "flex" }}>{editorial.hero.kicker}</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: ACCENT,
                marginRight: 14,
              }}
            />
            {site.domain}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 136,
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 0.85,
            }}
          >
            {editorial.hero.title[0]}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 136,
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 0.85,
            }}
          >
            {editorial.hero.title[1]}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: `1px solid ${RULE}`,
              marginTop: 36,
              paddingTop: 22,
              fontSize: 24,
              letterSpacing: "0.2em",
              color: MUTED,
            }}
          >
            <div style={{ display: "flex", color: INK }}>{editorial.hero.role}</div>
            <div style={{ display: "flex" }}>{editorial.hero.locale}</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", fontSize: 32, color: INK_2, maxWidth: 620 }}>
            {site.tagline}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: MUTED }}>
            Node.js · Django · PostgreSQL · AWS
          </div>
        </div>
      </div>
    ),
    size,
  );
}
