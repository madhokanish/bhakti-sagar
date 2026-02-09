"use client";

import { useEffect } from "react";

type Props = {
  lines: string[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  onCopy: (line: string) => void;
  onShare: (line: string) => void;
};

export default function VerseSelection({ lines, selectedIndex, onSelect, onCopy, onShare }: Props) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSelect]);

  return (
    <div className="space-y-5">
      {lines.map((line, index) => {
        const selected = index === selectedIndex;
        return (
          <div key={`${line}-${index}`} className="rounded-2xl px-2 py-1">
            <button
              type="button"
              onClick={() => onSelect(selected ? null : index)}
              className={`w-full text-left text-sagar-ink/90 ${selected ? "rounded-2xl bg-sagar-cream/70 px-3 py-3" : "px-1"}`}
              aria-pressed={selected}
            >
              {line}
            </button>
            {selected && (
              <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">
                <button
                  type="button"
                  onClick={() => onCopy(line)}
                  className="rounded-full border border-sagar-amber/30 bg-white px-3 py-1"
                >
                  Copy verse
                </button>
                <button
                  type="button"
                  onClick={() => onShare(line)}
                  className="rounded-full border border-sagar-amber/30 bg-white px-3 py-1"
                >
                  Share verse
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
