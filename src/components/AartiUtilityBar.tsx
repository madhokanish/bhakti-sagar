"use client";

import { useEffect, useMemo, useState } from "react";
import { isAartiBookmarked, toggleAartiBookmark } from "@/lib/bookmarks";

export default function AartiUtilityBar({ title, slug }: { title: string; slug?: string }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [textSize, setTextSize] = useState<"base" | "large">("base");
  const bookmarkKey = slug ?? title;

  useEffect(() => {
    const legacyKey = `bhakti-sagar-bookmark:${title}`;
    try {
      const legacy = Boolean(localStorage.getItem(legacyKey));
      const inStore = isAartiBookmarked(bookmarkKey);
      setSaved(legacy || inStore);
    } catch {
      // ignore
    }
  }, [title, bookmarkKey]);

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  function handleCopy() {
    handleShare();
  }

  function handleBookmark() {
    const legacyKey = `bhakti-sagar-bookmark:${title}`;
    try {
      const next = toggleAartiBookmark(bookmarkKey);
      if (next) {
        localStorage.setItem(legacyKey, "1");
      } else {
        localStorage.removeItem(legacyKey);
      }
      setSaved(next);
    } catch {
      // ignore
    }
  }

  const textLabel = useMemo(() => (textSize === "large" ? "Aa−" : "Aa+"), [textSize]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">
      <button
        type="button"
        onClick={handleShare}
        className="rounded-full border border-sagar-amber/30 bg-white px-3 py-1.5 hover:text-sagar-ink"
      >
        {copied ? "Copied" : "Share"}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-sagar-amber/30 bg-white px-3 py-1.5 hover:text-sagar-ink"
      >
        Copy
      </button>
      <button
        type="button"
        onClick={handleBookmark}
        className="rounded-full border border-sagar-amber/30 bg-white px-3 py-1.5 hover:text-sagar-ink"
      >
        {saved ? "Saved" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setTextSize(textSize === "large" ? "base" : "large")}
        className="rounded-full border border-sagar-amber/30 bg-white px-3 py-1.5 hover:text-sagar-ink"
      >
        {textLabel}
      </button>
    </div>
  );
}
