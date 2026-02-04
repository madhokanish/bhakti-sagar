"use client";

import { useState } from "react";

type LineExplainProps = {
  title: string;
  line: string;
  canUse: boolean;
  onUse: () => void;
};

export default function LineExplain({ title, line, canUse, onUse }: LineExplainProps) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  async function explainLine() {
    if (cached) return;
    if (!canUse) {
      setError("Limit reached. Please try again later.");
      return;
    }
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lyrics: [line],
          question: `Explain this line: ${line}`
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Unable to load explanation.");
      }

      const data = (await response.json()) as { answer: string };
      setAnswer(data.answer);
      setCached(true);
      onUse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load explanation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={explainLine}
        className="rounded-full border border-sagar-amber/40 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/60 hover:text-sagar-ink hover:shadow-[0_0_12px_rgba(229,106,32,0.35)]"
        type="button"
      >
        Explain this line
      </button>

      <div className="mt-2">
        {loading && (
          <div className="space-y-2">
            <div className="h-2 w-32 animate-pulse rounded-full bg-sagar-amber/20" />
            <div className="h-2 w-full animate-pulse rounded-full bg-sagar-amber/20" />
          </div>
        )}
        {!loading && error && <p className="text-xs text-sagar-rose">{error}</p>}
        {!loading && !error && answer && (
          <p className="text-xs leading-relaxed text-sagar-ink/70">{answer}</p>
        )}
      </div>
    </div>
  );
}
