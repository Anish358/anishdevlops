import { architecture } from "@/lib/content";

const INK = "#111111";
const PAPER = "#F5F4F0";
const MUTED = "#6E6B65";
const ACCENT = "oklch(0.46 0.19 258)";
const RULE = "rgba(17,17,17,0.26)";

const [agent, ingest, db, cache, rules, client] = architecture.nodes;

/**
 * FIG. 01 on the case study — the same six nodes as the homepage figure on a
 * different, taller geometry (1200×172). PostgreSQL and Redis are the fan-out
 * from ingest, joined by the dashed edge that invalidates cached reads.
 *
 * Coordinates come straight from the design file.
 */
export function DataPath() {
  return (
    <svg
      viewBox="0 0 1200 172"
      preserveAspectRatio="xMidYMid meet"
      className="ed-cs-figure-svg"
      role="img"
      aria-label={architecture.nodes.map((node) => node.title).join(" to ")}
    >
      <g stroke={RULE} strokeWidth="1" fill="none">
        <line x1="72" y1="86" x2="300" y2="86" />
        <line x1="300" y1="86" x2="560" y2="46" />
        <line x1="300" y1="86" x2="560" y2="126" />
        <line x1="560" y1="46" x2="800" y2="86" />
        <line x1="560" y1="126" x2="800" y2="86" />
        <line x1="800" y1="86" x2="1060" y2="86" />
      </g>

      <g stroke={ACCENT} strokeWidth="1" strokeDasharray="3 5" fill="none">
        <line x1="560" y1="46" x2="560" y2="126" />
      </g>

      <g fill={PAPER} stroke={INK} strokeWidth="1">
        <circle cx="72" cy="86" r="4" />
        <circle cx="300" cy="86" r="4" />
        <circle cx="800" cy="86" r="4" />
        <circle cx="1060" cy="86" r="4" />
      </g>
      <g fill={ACCENT} stroke="none">
        <circle cx="560" cy="46" r="4" />
        <circle cx="560" cy="126" r="4" />
      </g>

      <g fill={INK} className="ed-svg-mono" fontSize="10.5" letterSpacing="1.6">
        <text x="72" y="108" textAnchor="start">
          {agent.title.toUpperCase()}
        </text>
        <text x="300" y="108" textAnchor="middle">
          {ingest.title.toUpperCase()}
        </text>
        <text x="560" y="34" textAnchor="middle">
          {db.title.toUpperCase()}
        </text>
        <text x="560" y="146" textAnchor="middle">
          {cache.title.toUpperCase()}
        </text>
        <text x="800" y="108" textAnchor="middle">
          {rules.title.toUpperCase()}
        </text>
        <text x="1060" y="108" textAnchor="end">
          {client.title.toUpperCase()}
        </text>
      </g>

      <g fill={MUTED} className="ed-svg-mono" fontSize="9" letterSpacing="1.2">
        <text x="72" y="124" textAnchor="start">
          {agent.sub}
        </text>
        <text x="300" y="124" textAnchor="middle">
          {ingest.sub}
        </text>
        <text x="560" y="20" textAnchor="middle">
          {db.sub}
        </text>
        <text x="560" y="162" textAnchor="middle">
          {cache.sub}
        </text>
        <text x="800" y="124" textAnchor="middle">
          {rules.sub}
        </text>
        <text x="1060" y="124" textAnchor="end">
          {client.sub}
        </text>
      </g>
    </svg>
  );
}
