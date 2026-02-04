"use client";

import { useState } from "react";

type ShareButtonProps = {
  title: string;
};

export default function ShareButton({ title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // Fallback to clipboard
    }

    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="rounded-full border border-sagar-saffron/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-saffron hover:bg-sagar-saffron/10"
      aria-label={`Share ${title}`}
      type="button"
    >
      {copied ? "Link Copied" : "Share"}
    </button>
  );
}
