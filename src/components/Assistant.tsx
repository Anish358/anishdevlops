"use client";

import { useEffect, useRef, useState } from "react";
import { assistant } from "@/lib/content";
import { ArrowIcon } from "./primitives";

/** Mirrors the server's caps in src/app/api/chat/route.ts. */
const MAX_CHARS = 500;
const MAX_TURNS = 12;

type Turn = { role: "user" | "assistant"; content: string };

/**
 * Reads the SSE body one frame at a time, handing each delta to `onDelta` as
 * it lands. Server-sent frames are separated by a blank line and can be split
 * across network chunks, so the tail is buffered rather than parsed eagerly.
 */
async function readStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<{ error?: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return {};

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;

      let event: { type?: string; text?: string; message?: string };
      try {
        event = JSON.parse(line.slice(6));
      } catch {
        continue; // a malformed frame shouldn't kill the whole answer
      }

      if (event.type === "delta" && event.text) onDelta(event.text);
      // The stream is already a 200 by this point, so a mid-answer failure
      // arrives here rather than as a status code.
      if (event.type === "error") return { error: event.message };
    }
  }
}

/**
 * The system prompt tells the model to write plain prose, but models lean hard
 * on **bold** and it only takes one leak to put literal asterisks on the page.
 * This is the belt to that braces: it renders the emphasis instead of showing
 * the markers. Built as React nodes rather than HTML, so nothing the model
 * emits can inject markup.
 */
function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={index} className="font-medium text-fg">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

export function Assistant() {
  /**
   * Settled exchanges only — every user turn here has an answer after it.
   * The question currently in flight lives in `pending` instead, so a failed
   * request can never leave a dangling user turn in the history we replay.
   * (It could before: the server rightly rejects two user turns in a row, so
   * one error used to break every question after it until a refresh.)
   */
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState("");

  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abandon an in-flight answer if the visitor navigates away mid-stream;
  // the route handler cancels the upstream request when this disconnects.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Keep the newest text in view by scrolling the panel, never the page.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, partial]);

  const userTurns = turns.filter((turn) => turn.role === "user").length;
  const exhausted = userTurns >= MAX_TURNS;
  const busy = streaming;

  async function send(question: string) {
    const text = question.trim();
    if (!text || busy || exhausted) return;

    const history: Turn[] = [...turns, { role: "user", content: text }];
    setPending(text);
    setDraft("");
    setError("");
    setPartial("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let answer = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stream: true, messages: history }),
        signal: controller.signal,
      });

      // Failures before the stream opens still carry a real status code.
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? assistant.offline);
        return;
      }

      const result = await readStream(response.body, (delta) => {
        answer += delta;
        setPartial(answer);
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Only on a real answer does the exchange join the transcript.
      if (answer.trim()) {
        setTurns([...history, { role: "assistant", content: answer.trim() }]);
        setPending(null);
      } else {
        setError(assistant.offline);
      }
    } catch (cause) {
      // An abort is the visitor leaving, not a failure worth reporting.
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setError(assistant.offline);
      }
    } finally {
      setStreaming(false);
      setPartial("");
      abortRef.current = null;
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  const empty = turns.length === 0 && pending === null && !streaming && !error;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <span
          className="size-1.5 rounded-full bg-brand"
          aria-hidden="true"
        />
        <span className="font-mono text-[11px] tracking-[0.18em] text-brand uppercase">
          {assistant.badge}
        </span>
      </div>

      <div
        ref={transcriptRef}
        className="max-h-104 min-h-36 space-y-6 overflow-y-auto px-5 py-6"
      >
        {empty ? (
          <div className="space-y-4">
            <p className="font-mono text-[11px] tracking-[0.14em] text-fg-subtle uppercase">
              {assistant.suggestionsLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {assistant.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Announced politely so a screen reader hears the answer land. */}
        <div className="space-y-6" aria-live="polite" aria-atomic="false">
          {turns.map((turn, index) => (
            <div key={`${turn.role}-${index}`} className="space-y-1.5">
              <p className="font-mono text-[10px] tracking-[0.18em] text-fg-subtle uppercase">
                {turn.role === "user" ? assistant.you : assistant.ai}
              </p>
              <p
                className={
                  turn.role === "user"
                    ? "text-[15px] text-fg"
                    : "text-[15px] leading-relaxed whitespace-pre-wrap text-fg-muted"
                }
              >
                {renderText(turn.content)}
              </p>
            </div>
          ))}

          {pending !== null ? (
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] tracking-[0.18em] text-fg-subtle uppercase">
                {assistant.you}
              </p>
              <p className="text-[15px] text-fg">{pending}</p>
            </div>
          ) : null}

          {streaming ? (
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] tracking-[0.18em] text-fg-subtle uppercase">
                {assistant.ai}
              </p>
              {partial ? (
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-fg-muted">
                  {renderText(partial)}
                  <span
                    className="ml-0.5 inline-block h-[1.05em] w-0.5 translate-y-0.5 bg-brand animate-[blink_1s_ease-in-out_infinite]"
                    aria-hidden="true"
                  />
                </p>
              ) : (
                <p className="text-[15px] text-fg-subtle">{assistant.thinking}</p>
              )}
            </div>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}

        {exhausted && !streaming ? (
          <p className="text-sm text-fg-subtle">{assistant.exhausted}</p>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-border px-3 py-3"
      >
        <label htmlFor="assistant-input" className="sr-only">
          {assistant.placeholder}
        </label>
        <input
          id="assistant-input"
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MAX_CHARS}
          disabled={busy || exhausted}
          autoComplete="off"
          placeholder={exhausted ? assistant.exhausted : assistant.placeholder}
          className="w-full rounded-lg bg-transparent px-2.5 py-2 text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={busy || exhausted || !draft.trim()}
          className="group inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hi disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="sr-only sm:not-sr-only">{assistant.send}</span>
          <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}
