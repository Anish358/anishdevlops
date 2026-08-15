/**
 * Single source of truth for every word on the site.
 * Edit here, never in the components.
 */

export const site = {
  name: "Anish Shejawale",
  role: "Backend Developer",
  location: "Bengaluru, India",
  domain: "anishdevlops.xyz",
  url: "https://anishdevlops.xyz",
  // TODO(anish): confirm these two before launch
  email: "anishwork69@gmail.com",
  github: "https://github.com/Anish358",
  linkedin: "https://www.linkedin.com/in/anish358",
  resume: "/Anish-Shejawale-Backend-Developer.pdf",
  tagline: "I build APIs and data models — and run what I ship.",
  intro:
    "Two years building the systems behind data-heavy products in Node.js and Django. Alongside work I designed, built and operate PropVexis, a live multi-tenant SaaS, entirely on my own — including the AWS infrastructure, CI/CD and monitoring underneath it.",
  currently: "Backend Developer at Kamakhya Analytics",
  availability: "Open to backend and platform roles",
} as const;

/** Hero side panel — a spec sheet, not a bio. Every row is a fact. */
export const spec = [
  { key: "role", value: "Backend Developer" },
  { key: "based", value: "Bengaluru, India" },
  { key: "backend", value: "Node.js · Fastify · Django" },
  { key: "data", value: "PostgreSQL · Redis · MongoDB" },
  { key: "cloud", value: "AWS · Docker · CI/CD" },
  { key: "running", value: "app.propvexis.com", href: "https://app.propvexis.com" },
] as const;

/** The real GitHub Actions stages behind app.propvexis.com. */
export const pipeline = [
  { stage: "test", detail: "node:test suite" },
  { stage: "build", detail: "frontend bundle" },
  { stage: "ship", detail: "rsync to EC2" },
  { stage: "migrate", detail: "schema forward" },
  { stage: "release", detail: "pm2 restart" },
] as const;

/**
 * PropVexis data path, drawn as a diagram in <Architecture />.
 * Coordinates live in the component; this is the copy.
 */
export const architecture = {
  caption:
    "A closed trade leaves MetaTrader 5 and is on the trader's screen in under a second. Every hop is idempotent, so nothing double-counts on retry.",
  nodes: [
    { id: "agent", title: "MT5 Agent", sub: "MQL5" },
    { id: "ingest", title: "Ingest API", sub: "Fastify · idempotent" },
    { id: "db", title: "PostgreSQL", sub: "CTEs · composite idx" },
    { id: "cache", title: "Redis", sub: "cache · pub/sub" },
    { id: "rules", title: "Rule Engine", sub: "drawdown · targets" },
    { id: "client", title: "Browser", sub: "WebSockets" },
  ],
} as const;

export type Project = {
  slug: string;
  name: string;
  badge: string;
  /** Internal route to a longer write-up, if one exists. */
  caseStudy?: string;
  oneLiner: string;
  problem: string;
  features: { title: string; body: string }[];
  infra?: string;
  stack: string[];
  links: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    slug: "propvexis",
    name: "PropVexis",
    badge: "Flagship · Live in production",
    caseStudy: "/propvexis",
    oneLiner:
      "A multi-tenant SaaS trading journal for prop-firm traders. Designed, built and operated solo.",
    problem:
      "Traders on funded prop accounts get one shot at a strict rule set — breach the daily or maximum drawdown and the account is gone. Most of them track it in spreadsheets that tell them what happened yesterday, not that they are 0.4% away from losing the account right now.",
    features: [
      {
        title: "Real-time ingestion, end to end",
        body: "A MetaTrader 5 agent I wrote in MQL5 streams closed trades and account equity into an idempotent ingest API, so a retry or a replayed batch can never double-count a trade. Data lands in PostgreSQL and reaches the open browser over WebSockets within a second of the position closing.",
      },
      {
        title: "A configurable rule engine",
        body: "Every equity snapshot is evaluated against the trader's prop-firm rule set — daily and maximum drawdown, profit targets, minimum trading days — firing breach and proximity alerts before an account is lost, alongside ROI and payout tracking. Rule sets are data, so onboarding a new firm needs no code change.",
      },
      {
        title: "Analytics moved into the database",
        body: "The dashboard originally aggregated in application loops. I rebuilt it as PostgreSQL CTE and GROUP BY queries with composite indexes, cached in Redis and invalidated across clustered workers over Pub/Sub. It now holds roughly 1,000 concurrent users on a single instance.",
      },
      {
        title: "Multi-tenancy and billing",
        body: "Google OAuth 2.0 into JWT httpOnly-cookie sessions, row-level tenant scoping on every query, plan-gated entitlements, and Razorpay subscriptions with idempotent webhooks.",
      },
    ],
    infra:
      "I own the infrastructure too: GitHub Actions CI/CD to AWS EC2, three isolated environments, secrets in SSM Parameter Store, Terraform, Docker, Prometheus/Grafana and Sentry, nightly S3 backups.",
    stack: [
      "Node.js",
      "Fastify",
      "PostgreSQL",
      "Redis",
      "Socket.IO",
      "React",
      "MQL5",
      "AWS",
      "Docker",
      "Terraform",
      "GitHub Actions",
    ],
    links: [
      { label: "Live site", href: "https://app.propvexis.com" },
      { label: "GitHub", href: "https://github.com/Anish358/propvexis" },
    ],
  },
  {
    slug: "luxora",
    name: "Luxora",
    badge: "E-commerce platform",
    caseStudy: "/luxora",
    oneLiner:
      "A full e-commerce platform with payments, an admin console and live analytics.",
    problem:
      "Built end to end to understand the parts of commerce that are genuinely hard: keeping a catalogue consistent, taking money safely, and giving an operator real numbers instead of a wall of rows.",
    features: [
      {
        title: "Catalogue and checkout",
        body: "A 300+ product catalogue with secure payment integration, built on Express and MongoDB.",
      },
      {
        title: "Operator console",
        body: "An admin panel for product management with real-time monitoring and interactive analytics charts.",
      },
      {
        title: "Caching layer",
        body: "Cut server load and response times by roughly 30% by caching hot product queries in Redis.",
      },
    ],
    stack: ["React", "TypeScript", "OAuth", "Express", "MongoDB", "Redis", "AWS", "Docker"],
    links: [
      { label: "Live site", href: "https://luxora-mu.vercel.app/" },
      { label: "GitHub", href: "https://github.com/Anish358/luxora" },
    ],
  },
];

/** Long-form write-up at /propvexis. The trade-offs are the point. */
export const caseStudy = {
  decisions: [
    {
      title: "Idempotent ingest, not at-most-once delivery",
      body: "The agent runs on a trader's home PC over a connection I don't control, so retries and duplicate batches aren't edge cases — they're the normal operating condition. Deduplicating on a deterministic key at write time makes a replay a no-op, which lets the agent retry blindly and stay dumb. The alternative, tracking acknowledgement state on the client, puts correctness in the least reliable part of the system.",
    },
    {
      title: "Rule sets as data, not code",
      body: "Every prop firm has slightly different rules — different drawdown basis, different reset times, different minimum trading days. Storing rule sets as rows means onboarding a firm is a config change rather than a deploy, and one evaluator covers all of them. The cost is a more abstract engine and validation I have to write by hand instead of getting it from the type system.",
    },
    {
      title: "Aggregation in PostgreSQL, not in Node",
      body: "The dashboard originally pulled rows and reduced them in application loops. I moved it to CTEs and GROUP BY with composite indexes, so it's one round trip and the query planner does the work. What made the rewrite safe was that the existing tests asserting on the JavaScript aggregation became the oracle for the SQL version — same inputs, same numbers, or the build fails.",
    },
    {
      title: "Invalidation over short TTLs",
      body: "A short TTL is less machinery, but it means a trader can close a position and still see a stale dashboard — the one thing this product cannot do. Publishing invalidation over Redis Pub/Sub keeps every clustered worker consistent the moment data changes. The price is a message bus in the read path and a cache that fails toward correctness rather than availability.",
    },
    {
      title: "httpOnly cookies over localStorage tokens",
      body: "A token in localStorage is readable by any script that ends up on the page; an httpOnly cookie isn't. That buys XSS resistance and costs me CSRF handling and a same-site policy — a smaller and much better-understood problem than token theft.",
    },
    {
      title: "Row-level tenant scoping over schema-per-tenant",
      body: "Separate schemas are safe by construction but make migrations and any cross-tenant query painful. A single schema with scoping applied in one shared place is easier to evolve, and the isolation risk is concentrated where I can test it directly — so there are tests that assert one tenant's queries can never return another's rows.",
    },
  ],
  next: [
    "Move PostgreSQL off the application box to a managed instance. Co-locating them is the current single point of failure and the thing I'd fix first.",
    "Containerise the whole thing and run it on Kubernetes, with Terraform managing the infrastructure end to end rather than existing alongside it.",
    "Replace the last O(n) read path — the equity curve — with a materialised view, since it's the only query that still scales with a trader's history.",
  ],
} as const;

export const experience = [
  {
    company: "Varahe Analytics → Kamakhya Analytics",
    note: "subsidiary — continuous tenure",
    role: "Backend Developer",
    period: "May 2025 — Present",
    points: [
      "Built and optimised backend APIs in Django and SQL, using the ORM and Redis caching to cut database load by 40% and improve API response times.",
      "Automated the company's data-audit process end to end: a pipeline that transcribes surveyor audio recordings and validates them against the corresponding database records, replacing line-by-line manual review with exception-only review by auditors.",
      "Implemented secure authentication and authorisation flows across MongoDB and PostgreSQL systems, increasing reliability and reducing auth-related issues.",
      "Built full-stack features in React, Redux and Django, including the data-dense dashboards with charts and tables that internal teams rely on daily — a 35% improvement in how quickly they get to a number.",
      "Cut client-side load times by 30% through lazy loading, RTK Query caching and tighter state management.",
    ],
  },
  {
    company: "OpenStudyAI",
    role: "Full Stack Developer",
    period: "Dec 2024 — May 2025",
    points: [
      "Automated AI content generation on AWS Bedrock, cutting manual workload and increasing output by 50%.",
      "Designed and developed the entire front-end architecture for the platform.",
      "Improved platform scalability by 30% by optimising Redux-based state management, resulting in faster load times.",
    ],
  },
] as const;

export const skills = [
  {
    group: "Backend",
    items: ["Node.js", "Fastify", "Express", "Django", "Python", "REST", "WebSockets"],
  },
  {
    group: "Databases",
    items: ["PostgreSQL", "MongoDB", "Redis", "MySQL", "SQL", "Query optimisation"],
  },
  {
    group: "Cloud & DevOps",
    items: [
      "AWS",
      "EC2",
      "S3",
      "IAM",
      "SSM",
      "Docker",
      "Terraform",
      "GitHub Actions",
      "CI/CD",
      "Linux",
    ],
  },
  {
    group: "AI & LLMs",
    items: ["Claude / OpenAI APIs", "Prompt & context engineering"],
  },
  {
    group: "Frontend",
    items: ["React", "Next.js", "TypeScript", "Redux", "Tailwind CSS"],
  },
  {
    group: "Observability",
    items: ["Prometheus", "Grafana", "Sentry"],
  },
] as const;
