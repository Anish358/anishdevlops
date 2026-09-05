import { editorial } from "@/lib/content";
import { ContactForm } from "./ContactForm";

const { contact: copy } = editorial;

export function Contact() {
  return (
    <section id="contact" className="ed-section-contact">
      <div className="ed-contact-wrap">
        <h2 className="ed-contact-title">
          {copy.title[0]}
          <br />
          {copy.title[1]}
          <br />
          {copy.title[2]}
        </h2>
        <div className="ed-contact-aside">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
