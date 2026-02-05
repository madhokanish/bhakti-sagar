"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DailyAIInsightProps = {
  title: string;
  slug: string;
  lyrics: string[];
};

export default function DailyAIInsight({ title, slug, lyrics }: DailyAIInsightProps) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function getInsight() {
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const response = await fetch("/api/ai-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lyrics,
          question: "Give a short AI insight summary in easy words."
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Unable to load insight right now.");
      }

      const data = (await response.json()) as { answer: string };
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load insight.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getInsight();
  }, []);

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
          AI Insight
        </span>
        <h3 className="text-xl font-serif text-sagar-ink">Daily AI Insight</h3>
      </div>
      <p className="mt-3 text-sm text-sagar-ink/70">
        Today’s focus: <span className="font-semibold text-sagar-ink">{title}</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={getInsight}
          className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
          type="button"
        >
          Generate Insight
        </button>
        <Link
          href={`/aartis/${slug}`}
          className="rounded-full border border-sagar-saffron/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-saffron"
        >
          Read Aarti
        </Link>
      </div>

      <div className="mt-4 min-h-[110px] rounded-2xl border border-sagar-amber/10 bg-sagar-cream/60 p-4">
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
          <p className="text-sm text-sagar-ink/60">Tap generate to receive today’s AI Insight.</p>
        )}
      </div>
    </section>
  );
}
