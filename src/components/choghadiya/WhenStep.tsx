"use client";

import { WindowKey, windowOptions } from "@/lib/choghadiyaPlanner";

type Props = {
  value?: WindowKey;
  onChange: (windowKey: WindowKey) => void;
  customStart?: string;
  customEnd?: string;
  onCustomChange: (values: { start?: string; end?: string }) => void;
  autoEnabled: boolean;
  timeZoneLabel: string;
};

export default function WhenStep({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomChange,
  autoEnabled,
  timeZoneLabel
}: Props) {
  const showAutoHint = !autoEnabled;
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-sagar-ink">Step 2 · When?</p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {windowOptions.map((option) => {
          const disabled = option.requiresAuto && !autoEnabled;
          return (
            <button
              key={option.key}
              onClick={() => !disabled && onChange(option.key)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                value === option.key
                  ? "border-sagar-saffron bg-sagar-saffron text-white"
                  : "border-sagar-amber/30 bg-white text-sagar-ink/70"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {showAutoHint && (
        <p className="text-xs text-sagar-ink/60">
          Week, month, and custom ranges need automatic sunrise and sunset.
        </p>
      )}
      {value === "custom" && autoEnabled && (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
            Start ({timeZoneLabel})
            <input
              type="datetime-local"
              value={customStart ?? ""}
              onChange={(event) => onCustomChange({ start: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
            End ({timeZoneLabel})
            <input
              type="datetime-local"
              value={customEnd ?? ""}
              onChange={(event) => onCustomChange({ end: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
      )}
    </div>
  );
}
