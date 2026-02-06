"use client";

import { useState } from "react";
import { ChoghadiyaSegment, formatTimeWithDay } from "@/lib/choghadiya";
import { getSlotMeta } from "@/components/choghadiya/slotMeta";

type Props = {
  currentSegment: ChoghadiyaSegment | null;
  nextGood: ChoghadiyaSegment | null;
  countdown: string | null;
  timeZone: string;
  baseDateKey: string;
  sunrise?: Date | null;
  sunset?: Date | null;
  loading?: boolean;
};

export default function CurrentSlotCard({
  currentSegment,
  nextGood,
  countdown,
  timeZone,
  baseDateKey,
  sunrise,
  sunset,
  loading
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="rounded-2xl border border-sagar-amber/20 bg-white px-4 py-3">
        <div className="h-4 w-28 rounded-full bg-sagar-cream/70" />
        <div className="mt-3 h-5 w-40 rounded-full bg-sagar-cream/60" />
        <div className="mt-2 h-4 w-32 rounded-full bg-sagar-cream/60" />
      </div>
    );
  }

  if (!currentSegment) {
    return (
      <div className="rounded-2xl border border-sagar-amber/20 bg-white px-4 py-3">
        <p className="text-sm text-sagar-ink/60">Select a city to view the current slot.</p>
      </div>
    );
  }

  const meta = getSlotMeta(currentSegment.name);

  return (
    <div className="rounded-2xl border border-sagar-amber/20 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Current slot</p>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span aria-hidden="true">{meta.emoji}</span>
            <span className="font-semibold text-sagar-ink">{currentSegment.name}</span>
            <span className="rounded-full bg-sagar-amber/20 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70">
              {meta.labelText}
            </span>
          </div>
          <p className="text-xs text-sagar-ink/60">
            {formatTimeWithDay(currentSegment.start, timeZone, baseDateKey)} –{" "}
            {formatTimeWithDay(currentSegment.end, timeZone, baseDateKey)}
          </p>
          {countdown && <p className="text-xs text-sagar-ink/60">Ends in {countdown}</p>}
        </div>
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded-full border border-sagar-amber/30 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/60"
        >
          {expanded ? "Less" : "More"}
        </button>
      </div>
      {nextGood && (
        <p className="mt-2 text-xs text-sagar-ink/70">
          Next good slot: {nextGood.name} ·{" "}
          {formatTimeWithDay(nextGood.start, timeZone, baseDateKey)} –{" "}
          {formatTimeWithDay(nextGood.end, timeZone, baseDateKey)}
        </p>
      )}
      {expanded && (
        <div className="mt-2 text-xs text-sagar-ink/60">
          {sunrise && <p>Sunrise: {formatTimeWithDay(sunrise, timeZone, baseDateKey)}</p>}
          {sunset && <p>Sunset: {formatTimeWithDay(sunset, timeZone, baseDateKey)}</p>}
        </div>
      )}
    </div>
  );
}
