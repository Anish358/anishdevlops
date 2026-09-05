import { editorial, skills } from "@/lib/content";

/**
 * The stack, as hairline rows: mono group label, then the technologies.
 *
 * Same two-column row as the experience entries with one column dropped —
 * six groups of wildly different length don't fit the CURRENTLY cell grid,
 * and rows stack cleanly instead of leaving orphans on wrap.
 */
export function Stack() {
  return (
    <section id="stack" className="ed-section-stack">
      <div className="ed-stack-label">{editorial.stack.label}</div>
      {skills.map((group) => (
        <div key={group.group} className="ed-stack-row">
          <div className="ed-stack-group">{group.group.toUpperCase()}</div>
          <div className="ed-stack-items">{group.items.join(" · ")}</div>
        </div>
      ))}
    </section>
  );
}
