"use client";

import { useState } from "react";
import { editorial } from "@/lib/content";
import { ContactIcons } from "./ContactIcons";

const { contact: copy } = editorial;

/** Mirrors src/app/api/contact/route.ts. */
const LIMITS = { name: 80, email: 160, message: 4000 } as const;

type State = "idle" | "sending" | "sent" | "failed";
type Errors = { name?: string; email?: string; message?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<State>("idle");
  const [failure, setFailure] = useState("");

  function validate(): Errors {
    const next: Errors = {};
    if (!name.trim()) next.name = copy.required;
    if (!email.trim()) next.email = copy.required;
    else if (!EMAIL.test(email.trim())) next.email = copy.invalidEmail;
    if (!message.trim()) next.message = copy.required;
    return next;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setState("sending");
    setFailure("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, company }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setFailure(payload.error ?? "");
        setState("failed");
        return;
      }

      setName("");
      setEmail("");
      setMessage("");
      setState("sent");
    } catch {
      setFailure("");
      setState("failed");
    }
  }

  // The panels replace the form, so the icons ride along to stay reachable.
  if (state === "sent") {
    return (
      <>
        <div className="ed-contact-panel">
          <div className="ed-contact-panel-label">{copy.sent.label}</div>
          <p className="ed-contact-panel-text">{copy.sent.text}</p>
          <div className="ed-contact-panel-note">
            <span className="ed-dot-sm" aria-hidden="true" />
            {copy.sent.note}
          </div>
        </div>
        <ContactIcons className="ed-contact-icons--detached" />
      </>
    );
  }

  if (state === "failed") {
    return (
      <>
        <div className="ed-contact-panel" role="alert">
          <div className="ed-contact-panel-label">{copy.failed.label}</div>
          <p className="ed-contact-panel-text">{failure || copy.failed.text}</p>
          <button
            type="button"
            className="ed-contact-retry"
            onClick={() => setState("idle")}
          >
            {copy.failed.retry}
          </button>
        </div>
        <ContactIcons className="ed-contact-icons--detached" />
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="ed-field">
        <label className="ed-field-label" htmlFor="cf-name">
          {copy.fields.name.label}
        </label>
        <input
          id="cf-name"
          name="name"
          className="ed-field-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={copy.fields.name.placeholder}
          maxLength={LIMITS.name}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
        />
        <div className="ed-field-error">{errors.name ?? ""}</div>
      </div>

      <div className="ed-field">
        <label className="ed-field-label" htmlFor="cf-email">
          {copy.fields.email.label}
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          className="ed-field-input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.fields.email.placeholder}
          maxLength={LIMITS.email}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
        />
        <div className="ed-field-error">{errors.email ?? ""}</div>
      </div>

      <div className="ed-field ed-field--message">
        <label className="ed-field-label" htmlFor="cf-msg">
          {copy.fields.message.label}
        </label>
        <textarea
          id="cf-msg"
          name="message"
          rows={3}
          className="ed-field-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={copy.fields.message.placeholder}
          maxLength={LIMITS.message}
          aria-invalid={Boolean(errors.message)}
        />
        <div className="ed-field-error">{errors.message ?? ""}</div>
      </div>

      {/* honeypot: hidden from people, irresistible to bots */}
      <div className="ed-honeypot" aria-hidden="true">
        <label htmlFor="cf-company">Company</label>
        <input
          id="cf-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      <div className="ed-contact-actions">
        <ContactIcons />
        <button type="submit" className="ed-contact-submit" disabled={state === "sending"}>
          {state === "sending" ? copy.sending : copy.submit}
        </button>
      </div>
    </form>
  );
}
