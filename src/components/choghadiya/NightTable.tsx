"use client";

import { ChoghadiyaSegment, formatTime } from "@/lib/choghadiya";
import SegmentRow from "@/components/choghadiya/SegmentRow";
import type { ChoghadiyaCopy } from "@/lib/choghadiyaCopy";

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
  labels: Pick<
    ChoghadiyaCopy,
    | "night_label"
    | "sunset"
    | "next_sunrise"
    | "select_city_night"
    | "next_day_suffix"
    | "now"
    | "details"
    | "good_for"
    | "avoid"
    | "copy_times"
    | "add_reminder"
  >;
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
  onCopyTime,
  labels
}: Props) {
  return (
    <section className="space-y-2">
      <div className="sticky top-24 z-10 rounded-2xl border border-sagar-amber/20 bg-white px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">{labels.night_label}</p>
        <p className="text-xs text-sagar-ink/60">
          {dateLabel} · {labels.sunset} {sunset ? formatTime(sunset, timeZone) : "--"} · {labels.next_sunrise}{" "}
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
            labels={labels}
          />
        ))}
        {!segments.length && <p className="text-sm text-sagar-ink/60">{labels.select_city_night}</p>}
      </div>
    </section>
  );
}
