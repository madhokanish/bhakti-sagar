"use client";

import { ChoghadiyaSegment, formatTime, getDateKey } from "@/lib/choghadiya";
import { getSlotMeta } from "@/components/choghadiya/slotMeta";
import type { ChoghadiyaCopy } from "@/lib/choghadiyaCopy";

type Props = {
  segment: ChoghadiyaSegment;
  timeZone: string;
  baseDateKey: string;
  isCurrent: boolean;
  isHighlighted?: boolean;
  onAddReminder: (segment: ChoghadiyaSegment) => void;
  onCopyTime: (text: string) => void;
  labels?: Pick<
    ChoghadiyaCopy,
    "next_day_suffix" | "now" | "details" | "good_for" | "avoid" | "copy_times" | "add_reminder"
  >;
};

export default function SegmentRow({
  segment,
  timeZone,
  baseDateKey,
  isCurrent,
  isHighlighted,
  onAddReminder,
  onCopyTime,
  labels = {
    next_day_suffix: "(next day)",
    now: "Now",
    details: "Details",
    good_for: "Good for",
    avoid: "Avoid",
    copy_times: "Copy times",
    add_reminder: "Add reminder"
  }
}: Props) {
  const meta = getSlotMeta(segment.name);
  const endKey = getDateKey(segment.end, timeZone);
  const endSuffix = endKey !== baseDateKey ? ` ${labels.next_day_suffix}` : "";
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
              {labels.now}
              </span>
          )}
          <span className="text-xs text-sagar-ink/50">{labels.details}</span>
        </div>
      </summary>
      <div className="mt-3 space-y-2 text-xs text-sagar-ink/70">
        {meta.goodHint && <p>{labels.good_for}: {meta.goodHint}</p>}
        {meta.avoidHint && <p>{labels.avoid}: {meta.avoidHint}</p>}
        <div className="flex flex-wrap gap-2 pt-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/60">
          <button
            onClick={() => onCopyTime(timeText)}
            className="rounded-full border border-sagar-amber/30 px-2 py-1"
          >
            {labels.copy_times}
          </button>
          <button
            onClick={() => onAddReminder(segment)}
            className="rounded-full border border-sagar-amber/30 px-2 py-1"
          >
            {labels.add_reminder}
          </button>
        </div>
      </div>
    </details>
  );
}
