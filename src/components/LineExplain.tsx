"use client";

import { useMemo, useState } from "react";

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
  const [expanded, setExpanded] = useState(false);

  const shortAnswer = useMemo(() => {
    if (!answer) return null;
    const cleaned = answer.replace(/\s+/g, " ").trim();
    const stopIndex = cleaned.search(/[.!?]/);
    let lineText = stopIndex > 0 ? cleaned.slice(0, stopIndex + 1) : cleaned;
    if (lineText.length > 160) lineText = `${lineText.slice(0, 160).trim()}…`;
    return lineText;
  }, [answer]);

  async function explainLine() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (cached) {
      setExpanded(true);
      return;
    }
    if (!canUse) {
      setError("Limit reached. Please try again later.");
      setExpanded(true);
      return;
    }
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const response = await fetch("/api/ai-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lyrics: [line],
          question: `Explain this line: ${line}`
        })
      });

      if (!response.ok) {
        let message = "Unable to load explanation.";
        try {
          const data = await response.json();
          if (data?.error) {
            message = String(data.error);
          }
        } catch {
          try {
            const text = await response.text();
            if (text) message = text;
          } catch {
            // ignore
          }
        }
        throw new Error(message);
      }

      const data = (await response.json()) as { answer: string };
      setAnswer(data.answer);
      setCached(true);
      onUse();
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load explanation.");
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contents">
      <button
        onClick={explainLine}
        className="rounded-full border border-sagar-amber/40 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/60 hover:text-sagar-ink hover:shadow-[0_0_12px_rgba(229,106,32,0.35)]"
        type="button"
      >
        {expanded ? "Hide meaning" : "Explain this line"}
      </button>

      {expanded && (loading || error || shortAnswer) && (
        <div className="col-span-2 text-sm">
          {loading && (
            <div className="mt-2 h-2 w-32 animate-pulse rounded-full bg-sagar-amber/20" />
          )}
          {!loading && error && <p className="mt-2 text-sagar-rose">{error}</p>}
          {!loading && !error && shortAnswer && (
            <p className="mt-2 text-sagar-ink/60 italic">{shortAnswer}</p>
          )}
        </div>
      )}
    </div>
  );
}
