"use client";

import SegmentRow from "@/components/choghadiya/SegmentRow";
import { ChoghadiyaSegment, formatTimeWithDay } from "@/lib/choghadiya";

type Props = {
  id: string;
  title: string;
  anchorLabel: string;
  headerTime: Date | null;
  segments: ChoghadiyaSegment[];
  currentSegment: ChoghadiyaSegment | null;
  selectedTimeMs?: number | null;
  timeZone: string;
  baseDateKey: string;
  onAddReminder: (segment: ChoghadiyaSegment) => void;
  onCopyTime: (text: string) => void;
};

export default function TimetableSection({
  id,
  title,
  anchorLabel,
  headerTime,
  segments,
  currentSegment,
  selectedTimeMs,
  timeZone,
  baseDateKey,
  onAddReminder,
  onCopyTime
}: Props) {
  return (
    <section id={id} className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-sagar-rose">{title}</h2>
          {headerTime && (
            <p className="text-xs text-sagar-ink/60">
              {anchorLabel}: {formatTimeWithDay(headerTime, timeZone, baseDateKey)}
            </p>
          )}
        </div>
        <a href={`#${id}`} className="text-xs font-semibold text-sagar-saffron">
          Jump
        </a>
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
        {!segments.length && (
          <p className="text-sm text-sagar-ink/60">Select a city to see this timetable.</p>
        )}
      </div>
    </section>
  );
}
