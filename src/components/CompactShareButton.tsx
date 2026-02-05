"use client";

export default function CompactShareButton({ title }: { title: string }) {
  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // ignore
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 bg-white text-sagar-ink/60"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          d="M18 8a3 3 0 0 0-2.62 1.54l-6.15-3.08a3 3 0 1 0 0 2.08l6.15 3.08A3 3 0 1 0 18 8zm0 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM6 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM18 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
