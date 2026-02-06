"use client";

import { ChoghadiyaSegment, formatTime } from "@/lib/choghadiya";
import SegmentRow from "@/components/choghadiya/SegmentRow";

type Props = {
  dateLabel: string;
  sunset: Date | null;
  nextSunrise: Date | null;
  segments: ChoghadiyaSegment[];
  currentSegment: ChoghadiyaSegment | null;
  selectedTimeMs?: number | null;
  timeZone: string;
  baseDateKey: string;
  onAddReminder: (segment: ChoghadiyaSegment) => void;
  onCopyTime: (text: string) => void;
};

export default function NightTable({
  dateLabel,
  sunset,
  nextSunrise,
  segments,
  currentSegment,
  selectedTimeMs,
  timeZone,
  baseDateKey,
  onAddReminder,
  onCopyTime
}: Props) {
  return (
    <section className="space-y-2">
      <div className="sticky top-24 z-10 rounded-2xl border border-sagar-amber/20 bg-white px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Night</p>
        <p className="text-xs text-sagar-ink/60">
          {dateLabel} · Sunset {sunset ? formatTime(sunset, timeZone) : "--"} · Next Sunrise{" "}
          {nextSunrise ? formatTime(nextSunrise, timeZone) : "--"}
        </p>
      </div>
      <div className="space-y-2">
        {segments.map((segment) => (
          <SegmentRow
            key={`${segment.name}-${segment.start.toISOString()}`}
            segment={segment}
            timeZone={timeZone}
            baseDateKey={baseDateKey}
            isCurrent={currentSegment?.start.getTime() === segment.start.getTime()}
            isHighlighted={selectedTimeMs != null && selectedTimeMs === segment.start.getTime()}
            onAddReminder={onAddReminder}
            onCopyTime={onCopyTime}
          />
        ))}
        {!segments.length && <p className="text-sm text-sagar-ink/60">Select a city to see night choghadiya.</p>}
      </div>
    </section>
  );
}
