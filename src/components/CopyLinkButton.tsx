"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-sagar-amber/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70 hover:text-sagar-ink"
    >
      {copied ? "Copied" : "Copy Link"}
    </button>
  );
}
