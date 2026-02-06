"use client";

import { ChoghadiyaSegment, formatTime, getDateKey } from "@/lib/choghadiya";
import { getSlotMeta } from "@/components/choghadiya/slotMeta";

type Props = {
  segment: ChoghadiyaSegment;
  timeZone: string;
  baseDateKey: string;
  isCurrent: boolean;
  isHighlighted?: boolean;
  onAddReminder: (segment: ChoghadiyaSegment) => void;
  onCopyTime: (text: string) => void;
};

export default function SegmentRow({
  segment,
  timeZone,
  baseDateKey,
  isCurrent,
  isHighlighted,
  onAddReminder,
  onCopyTime
}: Props) {
  const meta = getSlotMeta(segment.name);
  const endKey = getDateKey(segment.end, timeZone);
  const endSuffix = endKey !== baseDateKey ? " (next day)" : "";
  const timeText = `${formatTime(segment.start, timeZone)} – ${formatTime(segment.end, timeZone)}${endSuffix}`;

  return (
    <details
      className={`rounded-2xl border border-sagar-amber/20 bg-white px-3 py-2 transition ${
        isHighlighted ? "ring-2 ring-sagar-saffron/70" : isCurrent ? "ring-1 ring-sagar-saffron/50" : ""
      }`}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span aria-hidden="true">{meta.emoji}</span>
          <div>
            <p className="font-semibold text-sagar-ink">
              {segment.name}{" "}
              <span className="text-xs text-sagar-ink/60">
                · {meta.labelText}
              </span>
            </p>
            <p className="text-xs text-sagar-ink/60">{timeText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCurrent && (
            <span className="rounded-full bg-sagar-saffron/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-saffron">
              Now
            </span>
          )}
          <span className="text-xs text-sagar-ink/50">Details</span>
        </div>
      </summary>
      <div className="mt-3 space-y-2 text-xs text-sagar-ink/70">
        {meta.goodHint && <p>Good for: {meta.goodHint}</p>}
        {meta.avoidHint && <p>Avoid: {meta.avoidHint}</p>}
        <div className="flex flex-wrap gap-2 pt-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/60">
          <button
            onClick={() => onCopyTime(timeText)}
            className="rounded-full border border-sagar-amber/30 px-2 py-1"
          >
            Copy times
          </button>
          <button
            onClick={() => onAddReminder(segment)}
            className="rounded-full border border-sagar-amber/30 px-2 py-1"
          >
            Add reminder
          </button>
        </div>
      </div>
    </details>
  );
}
