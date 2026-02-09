"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  fontSize: number;
  lineHeight: number;
  readingMode: boolean;
  keepAwake: boolean;
  autoScroll: boolean;
  autoScrollSpeed: number;
  onFontSizeChange: (value: number) => void;
  onLineHeightChange: (value: number) => void;
  onReadingModeChange: (value: boolean) => void;
  onKeepAwakeChange: (value: boolean) => void;
  onAutoScrollChange: (value: boolean) => void;
  onAutoScrollSpeedChange: (value: number) => void;
};

export default function ReadingSettingsModal({
  open,
  onClose,
  fontSize,
  lineHeight,
  readingMode,
  keepAwake,
  autoScroll,
  autoScrollSpeed,
  onFontSizeChange,
  onLineHeightChange,
  onReadingModeChange,
  onKeepAwakeChange,
  onAutoScrollChange,
  onAutoScrollSpeedChange
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close reading settings"
        className="absolute inset-0 bg-black/40"
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white px-6 pb-8 pt-6 shadow-sagar-card">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
            Reading settings
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">Font size</p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onFontSizeChange(Math.max(16, fontSize - 1))}
                className="h-8 w-8 rounded-full border border-sagar-amber/30 text-sm"
              >
                −
              </button>
              <span className="text-sm font-semibold text-sagar-ink">{fontSize}px</span>
              <button
                type="button"
                onClick={() => onFontSizeChange(Math.min(26, fontSize + 1))}
                className="h-8 w-8 rounded-full border border-sagar-amber/30 text-sm"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">Line spacing</p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onLineHeightChange(Math.max(1.4, Number((lineHeight - 0.1).toFixed(2))))}
                className="h-8 w-8 rounded-full border border-sagar-amber/30 text-sm"
              >
                −
              </button>
              <span className="text-sm font-semibold text-sagar-ink">{lineHeight.toFixed(1)}</span>
              <button
                type="button"
                onClick={() => onLineHeightChange(Math.min(2.0, Number((lineHeight + 0.1).toFixed(2))))}
                className="h-8 w-8 rounded-full border border-sagar-amber/30 text-sm"
              >
                +
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between text-sm text-sagar-ink">
            Reading mode
            <input
              type="checkbox"
              checked={readingMode}
              onChange={(event) => onReadingModeChange(event.target.checked)}
              className="h-4 w-4 accent-sagar-saffron"
            />
          </label>

          <label className="flex items-center justify-between text-sm text-sagar-ink">
            Keep screen awake
            <input
              type="checkbox"
              checked={keepAwake}
              onChange={(event) => onKeepAwakeChange(event.target.checked)}
              className="h-4 w-4 accent-sagar-saffron"
            />
          </label>

          <label className="flex items-center justify-between text-sm text-sagar-ink">
            Auto scroll
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(event) => onAutoScrollChange(event.target.checked)}
              className="h-4 w-4 accent-sagar-saffron"
            />
          </label>

          {autoScroll && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">Speed</p>
              <input
                type="range"
                min={8}
                max={40}
                step={2}
                value={autoScrollSpeed}
                onChange={(event) => onAutoScrollSpeedChange(Number(event.target.value))}
                className="mt-2 w-full"
              />
              <p className="mt-1 text-xs text-sagar-ink/60">{autoScrollSpeed}px / sec</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
