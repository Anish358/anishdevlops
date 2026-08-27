# anishdevlops.xyz — portfolio

Recruiter-facing personal site. Static, dark-only, one page.

**Stack:** Next.js 16 (App Router, static export by default) · TypeScript · Tailwind CSS v4 · Inter + JetBrains Mono via `next/font` · no UI library, no animation library.

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # verify it still prerenders as static
pnpm lint
```

## Editing content

**All copy lives in `src/lib/content.ts`.** Components read from it and contain no
prose. Add a project by pushing to the `projects` array; add a role by pushing to
`experience`. Nothing else needs touching.

## Design concept — "Instrumented"

The site presents itself as a production system its author runs. Every visual
element is a demonstration of the work rather than decoration around it:

- **Hero** — an ambient equity-curve canvas (`TickChart`), the visual language of
  the product being described. Deliberately abstract: a seeded random walk with no
  axes or numbers, so it never reads as a claim about data.
- **Spec card** — the hero's right column: a manifest of facts in mono, not a
  paragraph of self-description. A stat panel lived here first and was cut; bare
  numbers read as noise without the context the case study gives them.
- **Architecture diagram** — hand-authored SVG of the real PropVexis data path,
  with animated flow along each edge. This is the centrepiece; it's what makes an
  interviewer stop and read.
- **Pipeline** — the actual GitHub Actions stages behind app.propvexis.com.
- **Stack** — bento grid, varied spans on a 6-column grid.

Rules:

- Dark only. Near-black flat surfaces, hairline `1px` borders, an engineering grid
  masked to a vignette, and 2.5% film grain. **No gradients, no glassmorphism, no
  glowing blobs** — those read as a crypto landing page, not an engineer.
- One accent: `--color-brand` `#3B82F6`, the same blue as the PropVexis product,
  so the two surfaces read as one brand. Never used for large fills.
- Inter for prose. JetBrains Mono for numbers, labels, technical headings and
  every diagram annotation.
- Motion: 12px/420ms rise on scroll-in, `cubic-bezier(0.16, 1, 0.3, 1)`. All of it
  — reveals, canvas, flow dashes, blink — off under `prefers-reduced-motion`. The
  canvas also pauses when offscreen or the tab is hidden.
- Icons are inline SVG. Never emoji.
- No animation library and no UI library. Everything prerenders except the
  contact relay.
- **Homepage cards stay shallow** — name, description, diagram, stack, links. The
  problem statement, features and trade-offs belong on the case study. A card that
  says everything gives the reader no reason to click.

## Contact form

`ContactForm` posts JSON to `/api/contact`, which validates and relays via
Resend's REST API — no SDK dependency. It has a honeypot field, length caps, and
distinct messages for each failure. Without `RESEND_API_KEY` set it returns a 503
and the form tells visitors to email directly, so the page degrades instead of
silently swallowing messages.

Setup: copy `.env.example` to `.env.local`, add a Resend API key, and add the same
key in Vercel → Settings → Environment Variables. The default sender works without
verifying a domain; switch `CONTACT_FROM` once `anishdevlops.xyz` is verified.

## Conventions

- **Resume lives in exactly one place** — the sticky nav button. It's visible at
  every scroll position, which beats a copy in the hero and another in the footer.
- Section labels are numbered (`01 Projects`, `02 Experience`, …).
- Project links are only ever **Live site** and **GitHub**.

## Routes

| Route | What it is |
| --- | --- |
| `/` | The one-pager: hero, projects, experience, stack, contact |
| `/propvexis` | Long-form case study — architecture, decisions and trade-offs |
| `/luxora` | Shorter case study — why it exists and what's in it |
| `/api/contact` | Contact form relay (the only dynamic route) |
| `/opengraph-image` | 1200×630 social card, generated at build time |
| `/icon.svg` | Favicon, derived from the `anish.` wordmark |

The social card is generated from `src/app/opengraph-image.tsx` with `next/og`,
not exported from a design tool, so it can't drift from `content.ts`. It uses no
external font — a failed font fetch during a deploy would break the build for the
sake of a preview image. Note that Satori needs an explicit `display: flex` on any
element with more than one child, and interpolated text (`{a} · {b}`) counts as
several children.

## Before launch

- [ ] Add the PropVexis AI bullet once that feature ships

## Deploy

Live at **https://anishdevlops.xyz**. Pushing to `main` on
`Anish358/anishdevlops` deploys to production automatically.

- **Vercel project:** `anishdevlops` (a separate, older project named `portfolio`
  still owns `anishdevlops.vercel.app` — don't confuse the two when testing).
- **DNS:** GoDaddy. Apex `A @ → 216.198.79.1`, `CNAME www →
  c06a2f428dfee002.vercel-dns-017.com`. The legacy `76.76.21.21` /
  `cname.vercel-dns.com` pair also works; Vercel just nags about it.
- **Env:** `RESEND_API_KEY` must exist in Vercel → Environment Variables →
  Production, otherwise the contact form returns 503 in production.
- TLS is issued automatically by Vercel once DNS resolves. If HTTPS fails right
  after a DNS change, the certificate is still being provisioned — check for a
  `CAA` record before assuming anything is actually wrong.
- After changing DNS, a local resolver can serve the old IP until its TTL
  expires. `dig @8.8.8.8 anishdevlops.xyz` shows the truth;
  `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` fixes the Mac.

## The AI assistant

A visitor can ask about my experience, projects or background and get an answer
from a fixed set of facts — or an honest "I don't have that" pointing at the
contact form. Lives at `/api/chat`, rendered by the panel in section 01.

| File | Role |
|---|---|
| `src/lib/knowledge.ts` | Knowledge base + system prompt, assembled once at module load |
| `src/lib/model.ts` | Everything provider-specific (model choice, streaming, error mapping) |
| `src/lib/rate-limit.ts` | Per-IP limits and a global daily cap, in Upstash |
| `src/lib/questions.ts` | Question logging, PII-redacted |
| `evals/cases.mjs` | 37 eval cases across five groups |

**No RAG, on purpose.** The knowledge base is ~4.2k tokens. It fits in the
system prompt, so retrieval could only add a similarity-search step that
sometimes fetches the wrong chunk — a wrong answer about a real person's
career. Worth revisiting at roughly 50k tokens of source material.

**Facts derive from `content.ts`** wherever the site already publishes them, so
editing site copy updates the assistant in the same commit.

### Verifying it

```bash
pnpm dev            # in one terminal
pnpm verify:chat    # grounding, streaming, multi-turn
pnpm verify:limits  # rate limits (see the header of that file for setup)
pnpm eval           # 37 cases: factual, unknown, off-topic, injection, adversarial
pnpm questions      # what visitors have actually asked
```

`pnpm eval` exits non-zero, so it can gate a deploy. Runs are free but paced:
the provider's free tier has a per-model request ceiling, so the suite backs
off on 429 and a full run takes a couple of minutes.

### Environment

`GEMINI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. See
`.env.example`. Paste values **without** surrounding quotes — dotenv strips them
locally, which hides a quoted value until it breaks in production.
