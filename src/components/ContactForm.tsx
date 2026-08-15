"use client";

import { useState } from "react";
import { site } from "@/lib/content";
import { ArrowIcon } from "./primitives";

type State = "idle" | "sending" | "sent" | "error";

const field =
  "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-[15px] text-fg placeholder:text-fg-subtle transition-colors focus:border-brand focus:outline-none";

export function ContactForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;

    const data = new FormData(event.currentTarget);
    setState("sending");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          company: data.get("company"),
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok) {
        setError(result.error ?? "Something went wrong.");
        setState("error");
        return;
      }

      event.currentTarget.reset();
      setState("sent");
    } catch {
      setError("Network error. Please email me directly.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="card flex flex-col items-start gap-3 p-6">
        <span className="font-mono text-[11px] tracking-[0.18em] text-brand uppercase">
          message sent
        </span>
        <p className="text-fg-muted">
          Thanks — that&rsquo;s in my inbox. I&rsquo;ll reply within a day.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="cursor-pointer text-sm text-fg-subtle underline-offset-4 transition-colors hover:text-fg hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block font-mono text-[11px] tracking-[0.14em] text-fg-subtle uppercase"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            placeholder="Your name"
            className={field}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block font-mono text-[11px] tracking-[0.14em] text-fg-subtle uppercase"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            placeholder="you@company.com"
            className={field}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block font-mono text-[11px] tracking-[0.14em] text-fg-subtle uppercase"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          maxLength={4000}
          placeholder="The role, the team, what you're building — whatever's useful."
          className={`${field} resize-y`}
        />
      </div>

      {/* honeypot: hidden from people, irresistible to bots */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={state === "sending"}
          className="group inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hi disabled:cursor-wait disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Send message"}
          {state === "sending" ? null : (
            <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>

        <a
          href={`mailto:${site.email}`}
          className="text-sm text-fg-subtle underline-offset-4 transition-colors hover:text-fg hover:underline"
        >
          or email me directly
        </a>
      </div>

      {state === "error" ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </form>
  );
}
