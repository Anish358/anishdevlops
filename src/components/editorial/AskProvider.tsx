"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { assistant } from "@/lib/content";

/** Mirrors the server's cap in src/app/api/chat/route.ts. */
export const MAX_CHARS = 500;

/**
 * The design asks one question at a time — QUERY, RESPONSE, RELATED — with no
 * scrolling transcript, so each ask is a fresh single-turn request. That also
 * keeps every question well inside the server's 12-turn ceiling.
 */
export type AskStatus = "idle" | "retrieving" | "streaming" | "done" | "error";

type Ask = {
  draft: string;
  setDraft: (value: string) => void;
  query: string;
  answer: string;
  status: AskStatus;
  error: string;
  /** True once a question has been asked; swaps suggestions for the answer. */
  open: boolean;
  busy: boolean;
  ask: (question: string) => void;
  reset: () => void;
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
};

const AskContext = createContext<Ask | null>(null);

export function useAsk(): Ask {
  const value = useContext(AskContext);
  if (!value) throw new Error("useAsk must be used inside <AskProvider>");
  return value;
}

/**
 * Reads the SSE body one frame at a time, handing each delta to `onDelta` as
 * it lands. Frames are separated by a blank line and can be split across
 * network chunks, so the tail is buffered rather than parsed eagerly.
 */
async function readStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
  onReset: () => void,
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

      // The stream died and the server is re-answering from scratch. Throw
      // away the partial text rather than appending to it.
      if (event.type === "reset") onReset();
      if (event.type === "delta" && event.text) onDelta(event.text);
      // The response is already a 200 by this point, so a mid-answer failure
      // arrives here rather than as a status code.
      if (event.type === "error") return { error: event.message };
    }
  }
}

export function AskProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<AskStatus>("idle");
  const [error, setError] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);

  const busy = status === "retrieving" || status === "streaming";

  // Abandon an in-flight answer if the visitor navigates away mid-stream;
  // the route handler cancels the upstream request when this disconnects.
  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = useCallback((question: string) => {
    const text = question.trim().slice(0, MAX_CHARS);
    if (!text || busyRef.current) return;

    busyRef.current = true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setDraft("");
    setQuery(text);
    setAnswer("");
    setError("");
    setStatus("retrieving");

    void (async () => {
      let streamed = "";
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stream: true, messages: [{ role: "user", content: text }] }),
          signal: controller.signal,
        });

        // Failures before the stream opens still carry a real status code.
        if (!response.ok || !response.body) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          setError(payload.error ?? assistant.offline);
          setStatus("error");
          return;
        }

        const result = await readStream(
          response.body,
          (delta) => {
            streamed += delta;
            setAnswer(streamed);
            setStatus("streaming");
          },
          () => {
            streamed = "";
            setAnswer("");
          },
        );

        if (result.error) {
          setError(result.error);
          setStatus("error");
          return;
        }

        if (streamed.trim()) {
          setAnswer(streamed.trim());
          setStatus("done");
        } else {
          setError(assistant.offline);
          setStatus("error");
        }
      } catch (cause) {
        // An abort is the visitor leaving or asking again, not a failure.
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(assistant.offline);
        setStatus("error");
      } finally {
        busyRef.current = false;
      }
    })();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    busyRef.current = false;
    setQuery("");
    setAnswer("");
    setError("");
    setDraft("");
    setStatus("idle");
  }, []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // ⌘K / Ctrl-K opens the palette from anywhere; Escape closes it.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPaletteOpen(false);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<Ask>(
    () => ({
      draft,
      setDraft,
      query,
      answer,
      status,
      error,
      open: query !== "",
      busy,
      ask,
      reset,
      paletteOpen,
      openPalette,
      closePalette,
    }),
    [draft, query, answer, status, error, busy, ask, reset, paletteOpen, openPalette, closePalette],
  );

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}

/**
 * The system prompt asks for plain prose, but models lean on **bold** and one
 * leak would put literal asterisks on the page. Rendered as React nodes, not
 * HTML, so nothing the model emits can inject markup.
 */
export function renderAnswer(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}
