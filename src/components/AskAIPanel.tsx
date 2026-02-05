"use client";

import { useState } from "react";

type AskAIPanelProps = {
  title: string;
  lyrics: string[];
};

const SUGGESTED = [
  "Summarize the meaning",
  "Explain this aarti in simple words",
  "What is the main message?",
  "Explain the first verse",
  "How should I chant this?"
];

export default function AskAIPanel({ title, lyrics }: AskAIPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function askAI(input: string) {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const response = await fetch("/api/ai-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, lyrics, question: input.trim() })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Unable to load answer right now.");
      }

      const data = (await response.json()) as { answer: string };
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load answer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-card">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-sagar-saffron/40 bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sagar-saffron shadow-sagar-soft">
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-sagar-saffron/30 blur-[3px]" />
            <svg viewBox="0 0 24 24" aria-hidden="true" className="relative h-3.5 w-3.5 text-sagar-saffron">
              <path
                d="M12 2l3.8 6.2L22 12l-6.2 3.8L12 22l-3.8-6.2L2 12l6.2-3.8L12 2z"
                fill="currentColor"
              />
            </svg>
          </span>
          Ask AI
        </span>
        <h3 className="text-xl font-serif text-sagar-ink">Ask about this aarti</h3>
      </div>
      <p className="mt-3 text-sm text-sagar-ink/70">
        Ask anything about the meaning, message, or how to chant. Our AI Insight will answer in simple words.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED.map((item) => (
          <button
            key={item}
            onClick={() => {
              setQuestion(item);
              askAI(item);
            }}
            className="rounded-full border border-sagar-amber/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70 hover:text-sagar-ink"
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about this aarti..."
          className="min-h-[90px] w-full rounded-2xl border border-sagar-amber/30 bg-white px-4 py-3 text-sm text-sagar-ink/80 outline-none focus:border-sagar-saffron"
        />
        <button
          onClick={() => askAI(question)}
          className="self-start rounded-full bg-sagar-saffron px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white"
          type="button"
        >
          Ask AI
        </button>
      </div>

      <div className="mt-5 min-h-[120px] rounded-2xl border border-sagar-amber/10 bg-sagar-cream/60 p-4">
        {loading && (
          <div className="space-y-3">
            <div className="h-3 w-40 animate-pulse rounded-full bg-sagar-amber/20" />
            <div className="h-3 w-full animate-pulse rounded-full bg-sagar-amber/20" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-sagar-amber/20" />
          </div>
        )}
        {!loading && error && <p className="text-sm text-sagar-rose">{error}</p>}
        {!loading && !error && answer && <p className="text-sm leading-relaxed text-sagar-ink/80">{answer}</p>}
        {!loading && !error && !answer && (
          <p className="text-sm text-sagar-ink/60">Ask a question to receive an AI Insight.</p>
        )}
      </div>
    </section>
  );
}
