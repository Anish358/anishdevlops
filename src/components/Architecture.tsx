import { architecture } from "@/lib/content";

type Box = { id: string; x: number; y: number };

const W = 168;
const H = 58;

const boxes: Box[] = [
  { id: "agent", x: 8, y: 34 },
  { id: "ingest", x: 226, y: 34 },
  { id: "db", x: 444, y: 34 },
  { id: "cache", x: 662, y: 34 },
  { id: "rules", x: 226, y: 186 },
  { id: "client", x: 662, y: 186 },
];

const at = (id: string) => boxes.find((b) => b.id === id)!;

/** Horizontal edge between two boxes on the same row. */
function hEdge(fromId: string, toId: string, label?: string) {
  const from = at(fromId);
  const to = at(toId);
  const y = from.y + H / 2;
  const x1 = from.x + W;
  const x2 = to.x;
  return { d: `M${x1} ${y} H${x2 - 7}`, label, lx: (x1 + x2) / 2, ly: y - 9, arrow: { x: x2, y } };
}

const edges = [
  hEdge("agent", "ingest", "stream"),
  hEdge("ingest", "db", "persist"),
  hEdge("db", "cache", "cache"),
  hEdge("rules", "client", "alerts"),
  // ingest -> rules (down)
  {
    d: `M${at("ingest").x + W / 2} ${at("ingest").y + H} V${at("rules").y - 7}`,
    label: "equity",
    lx: at("ingest").x + W / 2 + 34,
    ly: (at("ingest").y + H + at("rules").y) / 2,
    arrow: { x: at("ingest").x + W / 2, y: at("rules").y, down: true },
  },
  // cache -> client (down)
  {
    d: `M${at("cache").x + W / 2} ${at("cache").y + H} V${at("client").y - 7}`,
    label: "push",
    lx: at("cache").x + W / 2 + 28,
    ly: (at("cache").y + H + at("client").y) / 2,
    arrow: { x: at("cache").x + W / 2, y: at("client").y, down: true },
  },
];

export function Architecture() {
  return (
    <figure className="mt-8">
      <div className="-mx-2 overflow-x-auto px-2 pb-2">
        <svg
          viewBox="0 0 838 262"
          role="img"
          aria-label="PropVexis data path: an MQL5 MetaTrader 5 agent streams into an idempotent Fastify ingest API, which persists to PostgreSQL and feeds a rule engine. PostgreSQL results are cached in Redis and pushed to the browser over WebSockets; rule-engine alerts are pushed to the browser too."
          className="w-full min-w-[640px]"
        >
          {edges.map((edge, i) => (
            <g key={i}>
              <path d={edge.d} stroke="var(--color-border-strong)" strokeWidth="1" fill="none" />
              <path
                d={edge.d}
                stroke="var(--color-brand)"
                strokeWidth="1.5"
                fill="none"
                className="flow"
                style={{ animationDelay: `${i * 110}ms` }}
              />
              <path
                d={
                  "down" in edge.arrow && edge.arrow.down
                    ? `M${edge.arrow.x - 4} ${edge.arrow.y - 6} L${edge.arrow.x} ${edge.arrow.y} L${edge.arrow.x + 4} ${edge.arrow.y - 6}`
                    : `M${edge.arrow.x - 6} ${edge.arrow.y - 4} L${edge.arrow.x} ${edge.arrow.y} L${edge.arrow.x - 6} ${edge.arrow.y + 4}`
                }
                stroke="var(--color-border-strong)"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
              {edge.label ? (
                <text x={edge.lx} y={edge.ly} textAnchor="middle" className="edge-label">
                  {edge.label}
                </text>
              ) : null}
            </g>
          ))}

          {architecture.nodes.map((node) => {
            const box = at(node.id);
            return (
              <g key={node.id}>
                <rect
                  x={box.x}
                  y={box.y}
                  width={W}
                  height={H}
                  rx="10"
                  fill="var(--color-surface-2)"
                  stroke="var(--color-border-strong)"
                />
                <text
                  x={box.x + 14}
                  y={box.y + 24}
                  fill="var(--color-fg)"
                  fontSize="13"
                  fontWeight="500"
                  fontFamily="var(--font-sans), sans-serif"
                >
                  {node.title}
                </text>
                <text
                  x={box.x + 14}
                  y={box.y + 42}
                  fill="var(--color-fg-subtle)"
                  fontSize="10"
                  fontFamily="var(--font-mono), monospace"
                >
                  {node.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <figcaption className="mt-4 text-[13px] leading-relaxed text-fg-subtle">
        {architecture.caption}
      </figcaption>
    </figure>
  );
}
