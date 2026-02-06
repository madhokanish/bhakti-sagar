"use client";

export default function Legend() {
  return (
    <details className="rounded-2xl border border-sagar-amber/20 bg-white px-4 py-2 text-xs text-sagar-ink/70">
      <summary className="cursor-pointer font-semibold uppercase tracking-[0.2em] text-sagar-rose">
        Legend
      </summary>
      <div className="mt-2 flex flex-wrap gap-3">
        <span>✨ Best</span>
        <span>✅ Good</span>
        <span>💰 Gain</span>
        <span>🚶 Neutral</span>
        <span>⚠️ Avoid</span>
        <span>⛔ Avoid</span>
        <span>😟 Avoid</span>
      </div>
    </details>
  );
}
