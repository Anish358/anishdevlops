import { editorial } from "@/lib/content";

const { currently } = editorial;

export function Currently() {
  return (
    <section className="ed-section-currently">
      <div className="ed-currently-label">{currently.label}</div>
      <div className="ed-currently-grid">
        {currently.cells.map((cell) => (
          <div key={cell.key} className="ed-currently-cell">
            <div className="ed-currently-key">{cell.key}</div>
            <div className="ed-currently-value">{cell.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
