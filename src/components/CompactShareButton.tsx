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
          d="M18 16a2 2 0 1 0-1.91-2.59l-7.2-3.6a2 2 0 1 0 0 1.18l7.2 3.6A2 2 0 0 0 18 16zM6 12a2 2 0 1 1 1.91-2.59l7.2-3.6A2 2 0 1 1 16 4a2 2 0 0 1 .09.59l-7.2 3.6A2 2 0 0 1 6 12z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
