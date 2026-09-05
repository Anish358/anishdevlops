"use client";

import { assistant, editorial, knowledgeBase } from "@/lib/content";
import { MAX_CHARS, renderAnswer, useAsk } from "./AskProvider";

const { ask: copy } = editorial;

const pad = (n: number) => String(n).padStart(2, "0");

/** The four-stop schematic beside the panel. Geometry from the design file. */
function Schematic() {
  return (
    <svg viewBox="0 0 120 210" className="ed-ask-schematic-svg" aria-hidden="true">
      <line x1="10" y1="10" x2="10" y2="200" stroke="rgba(17,17,17,0.2)" strokeWidth="1" />
      <g className="ed-svg-mono" fontSize="9.5" letterSpacing="1.4" fill="#6E6B65">
        <text x="24" y="14">
          {copy.schematic[0]}
        </text>
        <text x="24" y="77">
          {copy.schematic[1]}
        </text>
        <text x="24" y="140">
          {copy.schematic[2]}
        </text>
        <text x="24" y="203" fill="#111111">
          {copy.schematic[3]}
        </text>
      </g>
      <g fill="#F5F4F0" stroke="#111111" strokeWidth="1">
        <circle cx="10" cy="10" r="3.5" />
        <circle cx="10" cy="73" r="3.5" />
        <circle cx="10" cy="136" r="3.5" />
      </g>
      <circle cx="10" cy="199" r="3.5" fill="oklch(0.46 0.19 258)" />
    </svg>
  );
}

export function Ask() {
  const { draft, setDraft, query, answer, status, error, open, busy, ask, reset } = useAsk();

  const streaming = status === "retrieving" || status === "streaming";
  // Two suggestions the visitor hasn't just asked, to keep the thread going.
  const related = assistant.suggestions.filter((s) => s !== query).slice(0, 2);

  return (
    <section id="ask" className="ed-section-ask">
      <div className="ed-ask-head">
        <span>{copy.label}</span>
        <span className="ed-ask-online">
          {copy.system} <span className="ed-dot" aria-hidden="true" /> {copy.online}
        </span>
      </div>

      <div className="ed-ask-body">
        <div className="ed-ask-intro">
          <h2 className="ed-ask-title">
            {copy.title[0]}
            <br />
            {copy.title[1]}
          </h2>
          <p className="ed-ask-blurb">{copy.blurb}</p>

          <div className="ed-ask-schematic">
            <Schematic />
            <div className="ed-kb">
              <div className="ed-kb-label">{copy.kbLabel}</div>
              <div className="ed-kb-table">
                <div className="ed-kb-row">
                  <span className="ed-kb-key">{copy.kbRows.projects}</span>
                  <span>{pad(knowledgeBase.projects)}</span>
                </div>
                <div className="ed-kb-row">
                  <span className="ed-kb-key">{copy.kbRows.experience}</span>
                  <span>{pad(knowledgeBase.experience)}</span>
                </div>
                <div className="ed-kb-row">
                  <span className="ed-kb-key">{copy.kbRows.tech}</span>
                  <span>{knowledgeBase.technologies}</span>
                </div>
                <div className="ed-kb-row">
                  <span className="ed-kb-key">{copy.kbRows.focus}</span>
                  <span className="ed-kb-active">{copy.kbActive}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ed-ask-panel">
          <form
            className="ed-ask-form"
            onSubmit={(event) => {
              event.preventDefault();
              ask(draft);
            }}
          >
            <div className="ed-ask-form-label" id="ed-ask-label">
              {copy.formLabel}
            </div>
            <div className="ed-ask-input-row">
              <span className="ed-ask-caret-glyph" aria-hidden="true">
                &gt;
              </span>
              <input
                className="ed-ask-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={copy.placeholder}
                maxLength={MAX_CHARS}
                autoComplete="off"
                aria-labelledby="ed-ask-label"
              />
              <button
                type="submit"
                className="ed-ask-submit"
                disabled={busy || !draft.trim()}
                aria-label={assistant.send}
              >
                <span aria-hidden="true">↵</span>
              </button>
            </div>
            <div className="ed-ask-status">
              <span>{open ? copy.statusOpen : copy.statusIdle}</span>
              <span className="ed-ask-status-state">
                <span className="ed-dot-sm" aria-hidden="true" />
                {busy ? copy.stateBusy : copy.stateReady}
              </span>
            </div>
          </form>

          {open ? (
            <div className="ed-conversation">
              <div className="ed-conversation-label">{copy.queryLabel}</div>
              <p className="ed-conversation-query">{query}</p>

              <div className="ed-conversation-response-label">
                {status === "retrieving" ? copy.retrievingLabel : copy.responseLabel}
              </div>
              <p className="ed-conversation-answer" aria-live="polite">
                {error ? error : renderAnswer(answer)}
                {streaming ? <span className="ed-caret" aria-hidden="true" /> : null}
              </p>
              <div className="ed-conversation-source">
                {copy.sourceLabel} — {status === "error" ? copy.sourceFailed : copy.source}
              </div>

              <div className="ed-related">
                <div className="ed-related-label">{copy.relatedLabel}</div>
                {related.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="ed-related-item"
                    disabled={busy}
                    onClick={() => ask(question)}
                  >
                    → {question}
                  </button>
                ))}
                <a className="ed-related-item" href={copy.relatedHref.href}>
                  → {copy.relatedHref.label}
                </a>
                <button type="button" className="ed-related-reset" onClick={reset}>
                  {copy.reset}
                </button>
              </div>
            </div>
          ) : (
            <div className="ed-suggestions">
              <div className="ed-suggestions-label">{copy.suggestionsLabel}</div>
              {assistant.suggestions.map((question, index) => (
                <button
                  key={question}
                  type="button"
                  className="ed-suggestion"
                  disabled={busy}
                  onClick={() => ask(question)}
                >
                  <span className="ed-suggestion-index">{pad(index + 1)}</span>
                  <span>{question}</span>
                </button>
              ))}
            </div>
          )}

          {/* Not in the mock. The assistant sends what you type to a third
              party and logs the question, so the page has to say so. */}
          <p className="ed-ask-note">{assistant.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
