import { NextResponse } from "next/server";
import { site } from "@/lib/content";

const LIMITS = { name: 80, email: 160, message: 4000 } as const;

type Payload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  /** Honeypot — real users never fill a hidden field. */
  company?: unknown;
};

function asString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Bot filled the hidden field — accept silently so it doesn't retry.
  if (asString(body.company, 100)) {
    return NextResponse.json({ ok: true });
  }

  const name = asString(body.name, LIMITS.name);
  const email = asString(body.email, LIMITS.email);
  const message = asString(body.message, LIMITS.message);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email and message are all required." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json(
      { error: "That email address doesn't look right." },
      { status: 400 },
    );
  }

  if (message.length < 10) {
    return NextResponse.json(
      { error: "Could you add a little more detail?" },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not set — cannot deliver message.");
    return NextResponse.json(
      { error: "The form isn't wired up yet. Please email me directly." },
      { status: 503 },
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM ?? "Portfolio <onboarding@resend.dev>",
      to: [site.email],
      reply_to: email,
      subject: `Portfolio enquiry — ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  });

  if (!response.ok) {
    // Log the provider's reason, return something a human can act on.
    console.error("[contact] delivery failed", response.status, await response.text());
    return NextResponse.json(
      { error: "Something went wrong sending that. Please email me directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
