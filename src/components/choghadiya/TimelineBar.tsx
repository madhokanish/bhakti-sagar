"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChoghadiyaSegment, formatTimeWithDay } from "@/lib/choghadiya";

type Props = {
  segments: ChoghadiyaSegment[];
  sunTimes: { sunrise: Date; sunset: Date; nextSunrise: Date };
  timeZone: string;
  baseDateKey: string;
  selectedTimeMs: number | null;
  onSelectTime: (timeMs: number) => void;
};

export default function TimelineBar({
  segments,
  sunTimes,
  timeZone,
  baseDateKey,
  selectedTimeMs,
  onSelectTime
}: Props) {
  const [nowMs, setNowMs] = useState(Date.now());
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const timelineTotal = sunTimes.nextSunrise.getTime() - sunTimes.sunrise.getTime();
  const nowPosition = ((nowMs - sunTimes.sunrise.getTime()) / timelineTotal) * 100;
  const selectedRatio =
    ((selectedTimeMs ?? nowMs) - sunTimes.sunrise.getTime()) / timelineTotal;

  const selectedSegment = useMemo(() => {
    const ms = selectedTimeMs ?? nowMs;
    return segments.find((segment) => ms >= segment.start.getTime() && ms < segment.end.getTime()) ?? null;
  }, [segments, selectedTimeMs, nowMs]);

  const goodLabels = new Set(["Best", "Good", "Gain", "Neutral"]);

  function updateSelectedFromPointer(clientX: number) {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const time = sunTimes.sunrise.getTime() + ratio * timelineTotal;
    onSelectTime(time);
  }

  return (
    <div className="hidden md:block rounded-2xl border border-sagar-amber/20 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Timeline</p>
      <div
        ref={timelineRef}
        className="relative mt-4 h-6 rounded-full bg-sagar-cream/70"
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.max(0, Math.min(1, selectedRatio)) * 100)}
        onPointerDown={(event) => {
          scrubbingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateSelectedFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!scrubbingRef.current) return;
          updateSelectedFromPointer(event.clientX);
        }}
        onPointerUp={(event) => {
          scrubbingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          scrubbingRef.current = false;
        }}
        onKeyDown={(event) => {
          const step = timelineTotal / 24;
          const minTime = sunTimes.sunrise.getTime();
          const maxTime = sunTimes.nextSunrise.getTime() - 1;
          if (event.key === "ArrowRight") {
            const next = Math.min(maxTime, (selectedTimeMs ?? nowMs) + step);
            onSelectTime(next);
          }
          if (event.key === "ArrowLeft") {
            const next = Math.max(minTime, (selectedTimeMs ?? nowMs) - step);
            onSelectTime(next);
          }
        }}
      >
        <div className="absolute inset-0 flex overflow-hidden rounded-full">
          {segments.map((segment) => {
            const width =
              ((segment.end.getTime() - segment.start.getTime()) / timelineTotal) * 100;
            return (
              <button
                key={`${segment.name}-${segment.start.getTime()}`}
                className={`h-full ${goodLabels.has(segment.label) ? "bg-sagar-amber/50" : "bg-sagar-rose/30"}`}
                style={{ width: `${width}%` }}
                onClick={() => onSelectTime(segment.start.getTime())}
                aria-label={`${segment.name} ${segment.label}`}
              />
            );
          })}
        </div>
        <div
          className="absolute top-0 h-full w-0.5 bg-sagar-saffron"
          style={{ left: `${Math.max(0, Math.min(100, nowPosition))}%` }}
        />
      </div>
      {selectedSegment && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sagar-ink/70">
          <span className="font-semibold text-sagar-ink">{selectedSegment.name}</span>
          <span className="rounded-full bg-sagar-amber/20 px-2 py-0.5 text-xs uppercase text-sagar-ink/70">
            {selectedSegment.label}
          </span>
          <span>
            {formatTimeWithDay(selectedSegment.start, timeZone, baseDateKey)} –{" "}
            {formatTimeWithDay(selectedSegment.end, timeZone, baseDateKey)}
          </span>
        </div>
      )}
    </div>
  );
}
