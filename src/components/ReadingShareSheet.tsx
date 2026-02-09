"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  onShareVerse: () => void;
  onShareFull: () => void;
  onCopyLink: () => void;
};

export default function ReadingShareSheet({
  open,
  onClose,
  onShareVerse,
  onShareFull,
  onCopyLink
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close share"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white px-6 pb-8 pt-6 shadow-sagar-card">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Share</p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60"
          >
            Close
          </button>
        </div>
        <div className="mt-4 grid gap-3 text-sm">
          <button
            type="button"
            onClick={onShareVerse}
            className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/70 px-4 py-3 text-left font-semibold text-sagar-ink"
          >
            Share verse
          </button>
          <button
            type="button"
            onClick={onShareFull}
            className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/70 px-4 py-3 text-left font-semibold text-sagar-ink"
          >
            Share full aarti
          </button>
          <button
            type="button"
            onClick={onCopyLink}
            className="rounded-2xl border border-sagar-amber/20 bg-white px-4 py-3 text-left font-semibold text-sagar-ink"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
