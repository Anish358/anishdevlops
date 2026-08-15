import { ImageResponse } from "next/og";
import { site } from "@/lib/content";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated at build time rather than exported from a design tool, so it can
 * never drift from the copy in content.ts. No external font fetch — a failed
 * font request during a deploy would break the build for a social preview.
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
          backgroundColor: "#08090b",
          padding: "72px",
          // hairline grid, same motif as the site
          backgroundImage:
            "linear-gradient(to right, #1f242c 1px, transparent 1px), linear-gradient(to bottom, #1f242c 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: "#3b82f6",
              marginRight: 14,
            }}
          />
          <div
            style={{
              fontSize: 22,
              color: "#98a2b0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {site.domain}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 700,
              color: "#f3f5f7",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            I build backends
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#98a2b0",
            }}
          >
            and run them
            <span style={{ color: "#3b82f6" }}>.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid #1f242c",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{ display: "flex", fontSize: 30, color: "#f3f5f7", fontWeight: 600 }}
            >
              {site.name}
            </div>
            <div
              style={{ display: "flex", fontSize: 24, color: "#6a7380", marginTop: 8 }}
            >
              {`${site.role} · ${site.location}`}
            </div>
          </div>
          <div style={{ fontSize: 22, color: "#6a7380" }}>
            Node.js · Django · PostgreSQL · AWS
          </div>
        </div>
      </div>
    ),
    size,
  );
}
