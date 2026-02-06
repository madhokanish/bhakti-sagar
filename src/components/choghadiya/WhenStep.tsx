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
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
        Choose window
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value as WindowKey)}
          className="mt-2 w-full rounded-2xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a window
          </option>
          {windowOptions.map((option) => (
            <option
              key={option.key}
              value={option.key}
              disabled={option.requiresAuto && !autoEnabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </label>
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
