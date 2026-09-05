import { editorial } from "@/lib/content";

const { hero } = editorial;

export function Hero() {
  return (
    <section id="top" className="ed-hero">
      <div className="ed-hero-main">
        <div className="ed-hero-kicker">{hero.kicker}</div>
        <h1 className="ed-hero-title">
          {hero.title[0]}
          <br />
          {hero.title[1]}
        </h1>
        <div className="ed-hero-rule">
          <span className="ed-hero-role">{hero.role}</span>
          <span className="ed-hero-hairline" aria-hidden="true" />
          <span className="ed-hero-locale">{hero.locale}</span>
        </div>
        <p className="ed-hero-lede">{hero.lede}</p>
      </div>

      <aside className="ed-hero-aside">
        {hero.aside.map((block) => (
          <div key={block.label} className="ed-aside-block">
            <div className="ed-aside-label">{block.label}</div>
            {block.kind === "status" ? (
              <div className="ed-aside-status">
                <span className="ed-dot" aria-hidden="true" />
                {block.value}
              </div>
            ) : null}
            {block.kind === "list" ? (
              <div className="ed-aside-list">
                {block.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
            {block.kind === "value" ? (
              <div className="ed-aside-value">{block.value}</div>
            ) : null}
          </div>
        ))}
      </aside>
    </section>
  );
}
