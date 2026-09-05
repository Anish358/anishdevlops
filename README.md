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

## Design — "Editorial"

The whole site is built from the handoff bundle in `editorial-design-system-new/`
(exported from claude.ai/design). **Those HTML files are the source of truth for
every measurement**: change a value there first, then mirror it here.

- `project/Anish Shejawale - Homepage.dc.html` → `/`
- `project/PropVexis - Case Study.dc.html` → the case-study template, used by
  `/propvexis` and `/luxora`

Styles live in `src/app/editorial.css` and the markup in
`src/components/editorial/`. Tokens are declared on `:root`; every page-level
rule is scoped under `.editorial`.

- Light, printed feel: `#F5F4F0` paper over a 5px radial dot screen, `#111111`
  ink, `#35322D` for body copy, `#6E6B65` for labels, hairline rules at
  `rgba(17,17,17,0.14)` for structure, `0.12` for inner divisions, `0.1` for
  soft. One accent, `oklch(0.46 0.19 258)`.
- Archivo for display and prose, Space Mono for every label, figure annotation
  and number. Labels are stored pre-uppercased in `content.ts` — Space Mono at
  wide tracking kerns differently from `text-transform`.
- No breakpoints anywhere. Both templates are `flex-wrap` plus `clamp()`, so
  they reflow continuously rather than snapping.
- Border radius is 2px, and only on the ⌘ ASK button. Nothing else is rounded.
- Recurring idioms, so a new section reuses rather than invents: the numbered
  section eyebrow (label left, counter right), the `FIG. NN —` caption pair, the
  hairline two-column row (mono label at `flex 1 1 min(100%, 150px)`), the meta
  row, the 1px-gap cell grid over a rule-coloured ground, and the hairline
  key/value table.
- Prose measure: 52ch on the homepage, 62ch on the case studies.

Homepage specifics:

- **FIG. 01** is the real PropVexis write path on a fixed 1200×150 grid.
- Hover on the work index — the tint, the 10px shift, the detail strip dropping
  open — is pure CSS, so the section stays a server component.

Case-study specifics:

- A reduced header: a back link and a chapter marker instead of the wordmark and
  full nav, but the same ⌘ ASK button, so the palette works there too.
- One `CaseStudy` component renders both routes. Every section after the problem
  is optional and renders only when the project has content for it, so `/luxora`
  is the same template with the diagram, trade-offs, pipeline, runtime table and
  next-steps blocks absent — not a second layout.
- **FIG. 01** keeps the numbered figure treatment; the pipeline is deliberately
  quieter — an inline run of stages joined by accent hairlines, no figure number.
- `/luxora` was never mocked. It is derived from the PropVexis template, which is
  how the design brief framed it.

The **ASK** panel and the ⌘K palette share one `AskProvider`. Each question is a
fresh single-turn call to `/api/chat`, matching the design's one-question-at-a-
time layout. The palette takes its suggestions and placeholder per page: the
case studies ask about the project in front of you, the homepage asks about
Anish.

Two things in the code are not in the mocks, both deliberate: a visible
`:focus-visible` ring in the accent (the mocks leave focus to the browser, and
keyboard users need one), and the assistant provenance note under the ASK panel
(questions are logged and sent to a third party, so the page has to say so).

## Contact form

`src/components/editorial/ContactForm.tsx` posts JSON to `/api/contact`, which validates and relays via
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
| `/` | The one-pager: hero, FIG. 01, work, experience, stack, about, ask, contact |
| `/propvexis` | Long-form case study — problem, data path, features, trade-offs, pipeline, infrastructure, next |
| `/luxora` | The same template, reduced to the sections it has content for |
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
