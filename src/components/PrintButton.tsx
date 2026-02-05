"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-sagar-amber/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70 hover:text-sagar-ink"
    >
      Print / Download PDF
    </button>
  );
}
