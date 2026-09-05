import { editorial } from "@/lib/content";

const { about } = editorial;

export function About() {
  return (
    <section id="about" className="ed-section-about">
      <div className="ed-about-main">
        <div className="ed-about-label">{about.label}</div>
        <p className="ed-about-statement">{about.statement}</p>
        <div className="ed-about-ps">
          <span className="ed-about-ps-tag">{about.psTag}</span>
          <p className="ed-about-ps-text">{about.ps}</p>
        </div>
      </div>
      <div className="ed-about-aside">
        {about.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="ed-about-para">
            {paragraph}
          </p>
        ))}
        <a className="ed-about-link" href={about.link.href}>
          {about.link.label}
        </a>
      </div>
    </section>
  );
}
