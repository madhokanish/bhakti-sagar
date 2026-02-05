"use client";

import { useMemo, useState } from "react";

export default function LineMeaning({ title, line }: { title: string; line: string }) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const shortAnswer = useMemo(() => {
    if (!answer) return null;
    let cleaned = answer.replace(/\s+/g, " ").trim();
    cleaned = cleaned.replace(/^the line\s+["“][^"”]+["”]\s*/i, "");
    cleaned = cleaned.replace(/^this line\s*/i, "");
    const stopIndex = cleaned.search(/[.!?]/);
    let lineText = stopIndex > 0 ? cleaned.slice(0, stopIndex + 1) : cleaned;
    if (lineText.length > 160) lineText = `${lineText.slice(0, 160).trim()}…`;
    return lineText;
  }, [answer]);

  async function handleToggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (answer || error) {
      setExpanded(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lyrics: [line],
          question: `Explain this line in one short sentence: ${line}`
        })
      });

      if (!response.ok) {
        throw new Error("Unable to load meaning.");
      }

      const data = (await response.json()) as { answer: string };
      setAnswer(data.answer);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load meaning.");
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-sagar-amber/10 pb-4 last:border-b-0">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className="flex-1 text-left text-sagar-ink/90"
        >
          {line}
        </button>
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Explain this line"
          className="mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-sagar-amber/30 text-[0.6rem] text-sagar-ink/60"
        >
          ?
        </button>
      </div>
      {expanded && (
        <div className="mt-2 text-sm text-sagar-saffron">
          {loading && <span className="text-sagar-ink/60">Loading meaning…</span>}
          {!loading && error && <span className="text-sagar-rose">{error}</span>}
          {!loading && !error && shortAnswer && <span>{shortAnswer}</span>}
        </div>
      )}
    </div>
  );
}
