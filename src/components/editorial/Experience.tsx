import { editorial, experience } from "@/lib/content";

const section = editorial.experience;

export function Experience() {
  return (
    <section id="experience" className="ed-section-experience">
      <div className="ed-experience-label">{section.label}</div>

      {experience.map((role) => (
        <div key={role.company} className="ed-role">
          <div className="ed-role-period">{role.period.toUpperCase()}</div>
          <div className="ed-role-main">
            <h3 className="ed-role-title">{role.role.toUpperCase()}</h3>
            <div className="ed-role-company">{role.company}</div>
            <p className="ed-role-summary">{role.summary}</p>
          </div>
          <div className="ed-role-impact">
            <div className="ed-role-impact-label">{section.impactLabel}</div>
            <div className="ed-role-impact-list">
              {role.highlights.map((highlight) => (
                <div key={highlight} className="ed-role-impact-item">
                  <span className="ed-bullet" aria-hidden="true">
                    •
                  </span>
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="ed-meta-row ed-meta-row--closed">
        <span>{section.footer}</span>
        <a href={section.footerLink.href}>{section.footerLink.label}</a>
      </div>
    </section>
  );
}
