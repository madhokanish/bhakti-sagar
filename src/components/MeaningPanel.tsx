"use client";

import { useMemo, useState } from "react";
import AIBadge from "@/components/AIBadge";

type MeaningResponse =
  | { summary: string }
  | { meanings: string[] };

type Mode = "summary" | "line";

export default function MeaningPanel({ title, lyrics }: { title: string; lyrics: string[] }) {
  const [mode, setMode] = useState<Mode>("summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [meanings, setMeanings] = useState<string[] | null>(null);

  const activeContent = useMemo(() => {
    if (mode === "summary") return summary;
    return meanings;
  }, [mode, summary, meanings]);

  async function fetchMeaning(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/meaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lyrics,
          mode: nextMode
        })
      });

      if (!response.ok) {
        let message = "Unable to load meaning right now.";
        try {
          const data = await response.json();
          if (data?.error) {
            message = String(data.error);
          }
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const data = (await response.json()) as MeaningResponse;
      if (nextMode === "summary" && "summary" in data) {
        setSummary(data.summary);
      }
      if (nextMode === "line" && "meanings" in data) {
        setMeanings(data.meanings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load meaning.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
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
            AI Insight
          </span>
          <h3 className="text-xl font-serif text-sagar-ink">Understand the prayer in easy words</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchMeaning("summary")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              mode === "summary" ? "bg-sagar-saffron text-white" : "border border-sagar-saffron/40 text-sagar-saffron"
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => fetchMeaning("line")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              mode === "line" ? "bg-sagar-saffron text-white" : "border border-sagar-saffron/40 text-sagar-saffron"
            }`}
          >
            Line-by-line
          </button>
        </div>
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
        {!loading && !error && !activeContent && (
          <p className="text-sm text-sagar-ink/60">Choose an option to read the meaning.</p>
        )}
        {!loading && !error && mode === "summary" && typeof activeContent === "string" && (
          <p className="text-sm leading-relaxed text-sagar-ink/80">{activeContent}</p>
        )}
        {!loading && !error && mode === "line" && Array.isArray(activeContent) && (
          <div className="space-y-3">
            {lyrics.map((line, index) => (
              <div key={`${line}-${index}`} className="rounded-xl bg-white/70 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-sagar-rose">Line {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-sagar-ink">{line}</p>
                <p className="mt-2 text-sm text-sagar-ink/70">
                  {activeContent[index] || "Meaning will appear here."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
