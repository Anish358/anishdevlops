import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-6 sm:px-8 ${className}`}>{children}</div>
  );
}

export function Section({
  id,
  index,
  label,
  title,
  children,
}: {
  id: string;
  index: string;
  label: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <div className="mb-10 flex items-center gap-4">
          <span className="font-mono text-[11px] text-fg-subtle tabular-nums">
            {index}
          </span>
          <span className="font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
            {label}
          </span>
          <span className="hairline h-px flex-1" aria-hidden="true" />
        </div>
        {title ? (
          <h2 className="mb-8 max-w-2xl text-2xl font-semibold sm:text-3xl">{title}</h2>
        ) : null}
        {children}
      </Container>
    </section>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-[11px] text-fg-muted">
      {children}
    </span>
  );
}

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3.5 8h9M8.5 4l4 4-4 4" />
    </svg>
  );
}

export function ExternalIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6.5 3.5h6v6M12.5 3.5 7 9M12 9.5v3h-9v-9h3" />
    </svg>
  );
}
