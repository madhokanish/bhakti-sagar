"use client";

import { WindowKey, windowOptions } from "@/lib/choghadiyaPlanner";
import type { ChoghadiyaCopy } from "@/lib/choghadiyaCopy";

type Props = {
  value?: WindowKey;
  onChange: (windowKey: WindowKey) => void;
  customStart?: string;
  customEnd?: string;
  onCustomChange: (values: { start?: string; end?: string }) => void;
  autoEnabled: boolean;
  timeZoneLabel: string;
  labels: Pick<
    ChoghadiyaCopy,
    "step2_title" | "choose_window" | "select_window" | "week_month_hint" | "start" | "end"
  >;
  options?: Array<{ key: WindowKey; label: string; requiresAuto?: boolean }>;
};

export default function WhenStep({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomChange,
  autoEnabled,
  timeZoneLabel,
  labels,
  options
}: Props) {
  const resolvedOptions = options ?? windowOptions;
  const showAutoHint = !autoEnabled;
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-sagar-ink">{labels.step2_title}</p>
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
        {labels.choose_window}
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value as WindowKey)}
          className="mt-2 w-full rounded-2xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            {labels.select_window}
          </option>
          {resolvedOptions.map((option) => (
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
          {labels.week_month_hint}
        </p>
      )}
      {value === "custom" && autoEnabled && (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
            {labels.start} ({timeZoneLabel})
            <input
              type="datetime-local"
              value={customStart ?? ""}
              onChange={(event) => onCustomChange({ start: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
            {labels.end} ({timeZoneLabel})
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
