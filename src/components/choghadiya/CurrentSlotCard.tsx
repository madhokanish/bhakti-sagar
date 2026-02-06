"use client";

import { useEffect, useMemo, useState } from "react";
import { ChoghadiyaSegment, formatCountdown, formatTimeWithDay, getCurrentSegment, getNextGoodSegment } from "@/lib/choghadiya";
import { getSlotMeta } from "@/components/choghadiya/slotMeta";

type Props = {
  segments: ChoghadiyaSegment[];
  timeZone: string;
  baseDateKey: string;
  sunrise?: Date | null;
  sunset?: Date | null;
  loading?: boolean;
  isToday: boolean;
  dateLabel: string;
  hasTimes: boolean;
};

export default function CurrentSlotCard({
  segments,
  timeZone,
  baseDateKey,
  sunrise,
  sunset,
  loading,
  isToday,
  dateLabel,
  hasTimes
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isToday]);

  const currentSegment = useMemo(() => {
    if (!segments.length || !isToday) return null;
    return getCurrentSegment(segments, new Date(nowMs));
  }, [segments, nowMs, isToday]);

  const nextGood = useMemo(() => {
    if (!segments.length || !isToday) return null;
    return getNextGoodSegment(segments, new Date(nowMs));
  }, [segments, nowMs, isToday]);

  const countdown = currentSegment
    ? formatCountdown(currentSegment.end.getTime() - nowMs)
    : null;

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
        <p className="text-sm text-sagar-ink/60">
          {!hasTimes
            ? "Select a city to view the current slot."
            : isToday
              ? "Current slot will appear here."
              : `Viewing timetable for ${dateLabel}.`}
        </p>
      </div>
    );
  }

  const meta = currentSegment ? getSlotMeta(currentSegment.name) : null;

  return (
    <div className="rounded-2xl border border-sagar-amber/20 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Current slot</p>
          {meta && (
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span aria-hidden="true">{meta.emoji}</span>
              <span className="font-semibold text-sagar-ink">{currentSegment.name}</span>
              <span className="rounded-full bg-sagar-amber/20 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70">
                {meta.labelText}
              </span>
            </div>
          )}
          <p className="text-xs text-sagar-ink/60">
            {formatTimeWithDay(currentSegment.start, timeZone, baseDateKey)} –{" "}
            {formatTimeWithDay(currentSegment.end, timeZone, baseDateKey)}
          </p>
          {isToday && countdown && <p className="text-xs text-sagar-ink/60">Ends in {countdown}</p>}
        </div>
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded-full border border-sagar-amber/30 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/60"
        >
          {expanded ? "Less" : "More"}
        </button>
      </div>
      {isToday && nextGood && (
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
