"use client";

import { useEffect, useRef } from "react";
import { assistant, editorial } from "@/lib/content";
import { MAX_CHARS, renderAnswer, useAsk } from "./AskProvider";

const { ask: copy } = editorial;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The ⌘K surface. Same ask state as the ASK section, so an answer shows on both.
 *
 * Suggestions and placeholder are per-page: the case studies ask about the
 * project in front of you, the homepage asks about Anish.
 */
export function CommandPalette({
  suggestions = assistant.suggestions.slice(0, 3),
  placeholder = copy.palettePlaceholder,
}: {
  suggestions?: readonly string[];
  placeholder?: string;
} = {}) {
  const {
    draft,
    setDraft,
    query,
    answer,
    status,
    error,
    open,
    busy,
    ask,
    paletteOpen,
    closePalette,
  } = useAsk();

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Focus moves in on open and back to whatever opened it on close — ⌘K can be
  // pressed from anywhere, so the trigger isn't always the header button.
  useEffect(() => {
    if (paletteOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      inputRef.current?.focus();
      return;
    }
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
  }, [paletteOpen]);

  // Hold the page still under the overlay. Padding compensates for the
  // scrollbar the lock removes, so nothing shifts sideways.
  useEffect(() => {
    if (!paletteOpen) return;
    const { body } = document;
    const overflow = body.style.overflow;
    const paddingRight = body.style.paddingRight;
    const gutter = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    return () => {
      body.style.overflow = overflow;
      body.style.paddingRight = paddingRight;
    };
  }, [paletteOpen]);

  /** Keeps Tab inside the dialog instead of walking into the page behind it. */
  function trapTab(event: React.KeyboardEvent) {
    if (event.key !== "Tab") return;
    const stops = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!stops || stops.length === 0) return;

    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!paletteOpen) return null;

  return (
    <div
      className="ed-palette-backdrop"
      onClick={closePalette}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="ed-palette"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={trapTab}
        role="dialog"
        aria-modal="true"
        aria-label={copy.formLabel}
      >
        <form
          className="ed-palette-form"
          onSubmit={(event) => {
            event.preventDefault();
            ask(draft);
          }}
        >
          <span className="ed-palette-glyph" aria-hidden="true">
            &gt;
          </span>
          <input
            ref={inputRef}
            className="ed-palette-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            maxLength={MAX_CHARS}
            autoComplete="off"
            aria-label={placeholder}
          />
          <span className="ed-palette-esc">{copy.esc}</span>
        </form>

        <div className="ed-palette-answer" data-open={open}>
          <div className="ed-palette-answer-clip">
            <div className="ed-palette-answer-inner">
              <div className="ed-palette-answer-label">{copy.queryLabel}</div>
              <p className="ed-palette-query">{query}</p>
              <div className="ed-palette-response-label">
                {status === "retrieving" ? copy.retrievingLabel : copy.responseLabel}
              </div>
              <p className="ed-palette-text" aria-live="polite">
                {error ? error : renderAnswer(answer)}
                {status === "retrieving" || status === "streaming" ? (
                  <span className="ed-caret" aria-hidden="true" />
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className="ed-palette-suggestions">
          <div className="ed-palette-suggestions-label">{copy.suggestionsLabel}</div>
          {suggestions.map((question, index) => (
            <button
              key={question}
              type="button"
              className="ed-palette-suggestion"
              disabled={busy}
              onClick={() => ask(question)}
            >
              <span className="ed-palette-suggestion-index">{pad(index + 1)}</span>
              <span>{question}</span>
            </button>
          ))}
        </div>

        <div className="ed-palette-footer">
          <span className="ed-palette-footer-state">
            <span className="ed-dot-sm" aria-hidden="true" />
            {busy ? copy.stateBusy : copy.stateReady}
          </span>
          <span>
            <span className="ed-symbol" aria-hidden="true">
              ↵
            </span>{" "}
            {copy.enterToAsk}
          </span>
        </div>
      </div>
    </div>
  );
}
