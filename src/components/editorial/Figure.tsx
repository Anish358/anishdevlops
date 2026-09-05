import { editorial } from "@/lib/content";

const { figure } = editorial;

const INK = "#111111";
const PAPER = "#F5F4F0";
const MUTED = "#6E6B65";
const ACCENT = "oklch(0.46 0.19 258)";
const RULE = "rgba(17,17,17,0.26)";

/**
 * FIG. 01 — the PropVexis write path.
 *
 * The coordinates come straight from the design file, so move a node here only
 * by moving it there first. The viewBox is the design's 1200×150 grown 12 units
 * upward to enclose the `replay on failure` label, which the mock let overflow
 * — the drawing scale is unchanged, but the box can now live in a scroll
 * container without clipping. Both blue nodes are the fan-out from the ingest API:
 * the durable write and the cache that the browser reads through.
 */
export function Figure() {
  return (
    <section className="ed-figure">
      <div className="ed-figure-caption">
        <span>{figure.caption}</span>
        <span>{figure.mode}</span>
      </div>
      <div className="ed-figure-scroll">
        <svg
          viewBox="0 -12 1200 162"
          preserveAspectRatio="xMidYMid meet"
          className="ed-figure-svg"
          role="img"
          aria-label={`${figure.source} to ${figure.api} to ${figure.upper} and ${figure.lower}, through ${figure.worker} to ${figure.sink}.`}
        >
          <g stroke={RULE} strokeWidth="1" fill="none">
            <line x1="60" y1="72" x2="300" y2="72" />
            <line x1="300" y1="72" x2="560" y2="34" />
            <line x1="300" y1="72" x2="560" y2="110" />
            <line x1="560" y1="34" x2="830" y2="34" />
            <line x1="830" y1="34" x2="1080" y2="72" />
            <line x1="560" y1="110" x2="1080" y2="72" />
          </g>

          {/* The feedback edge: a rule breach invalidates the cached reads. */}
          <g stroke={ACCENT} strokeWidth="1" strokeDasharray="3 5" fill="none">
            <path d="M 830 34 C 830 -6, 300 -6, 300 62" />
          </g>

          <g fill={PAPER} stroke={INK} strokeWidth="1">
            <circle cx="60" cy="72" r="4" />
            <circle cx="300" cy="72" r="4" />
            <circle cx="830" cy="34" r="4" />
            <circle cx="1080" cy="72" r="4" />
          </g>
          <g fill={ACCENT} stroke="none">
            <circle cx="560" cy="34" r="4" />
            <circle cx="560" cy="110" r="4" />
          </g>

          <g
            fill={INK}
            className="ed-svg-mono"
            fontSize="10.5"
            letterSpacing="1.6"
          >
            <text x="60" y="94" textAnchor="start">
              {figure.source}
            </text>
            <text x="300" y="94" textAnchor="middle">
              {figure.api}
            </text>
            <text x="560" y="22" textAnchor="middle">
              {figure.upper}
            </text>
            <text x="560" y="130" textAnchor="middle">
              {figure.lower}
            </text>
            <text x="830" y="22" textAnchor="middle">
              {figure.worker}
            </text>
            <text x="1080" y="94" textAnchor="end">
              {figure.sink}
            </text>
          </g>

          <g fill={MUTED} className="ed-svg-mono" fontSize="9" letterSpacing="1.2">
            <text x="300" y="110" textAnchor="middle">
              {figure.apiSub}
            </text>
            <text x="560" y="146" textAnchor="middle">
              {figure.lowerSub}
            </text>
            <text x="830" y="8" textAnchor="middle">
              {figure.workerSub}
            </text>
            <text x="1080" y="110" textAnchor="end">
              {figure.sinkSub}
            </text>
          </g>

          <text
            x="565"
            y="-2"
            textAnchor="middle"
            fill={ACCENT}
            className="ed-svg-mono"
            fontSize="9"
            letterSpacing="1.2"
          >
            {figure.loop}
          </text>
        </svg>
      </div>
    </section>
  );
}
