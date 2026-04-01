"use client";

import { PlannerResult, PlannerSegment, WindowKey, isAvoid } from "@/lib/choghadiyaPlanner";
import type { ChoghadiyaCopy } from "@/lib/choghadiyaCopy";

type DailyBest = {
  dateISO: string;
  day?: PlannerResult;
  night?: PlannerResult;
};

type Props = {
  goalLabel: string;
  cityLabel: string;
  dateLabel: string;
  windowLabel: string;
  windowKey: WindowKey;
  todayISO: string;
  tomorrowISO: string;
  best?: PlannerResult;
  others: PlannerResult[];
  daily: DailyBest[];
  includeAvoid: boolean;
  onIncludeAvoidChange: (value: boolean) => void;
  onAddReminder: (segment: PlannerSegment) => void;
  onShare: () => void;
  onCopy: (text: string) => void;
  formatTime: (segment: PlannerSegment) => string;
  aiWhy?: string | null;
  aiExtra?: string | null;
  onSaveGoal?: () => void;
  onApply?: (segment: PlannerSegment) => void;
  labels: Pick<
    ChoghadiyaCopy,
    | "avoid"
    | "add_reminder"
    | "share"
    | "copy_text"
    | "include_avoid"
    | "no_good_slots"
    | "results"
    | "best_pick"
    | "apply_to_timetable"
    | "save_plan"
    | "other_good_options"
    | "daily_best_slots"
    | "best_daytime"
    | "best_night"
    | "best_time_for"
  >;
};

function ResultCard({
  title,
  result,
  formatTime,
  onAddReminder,
  onShare,
  onCopy,
  aiWhy,
  aiExtra,
  labels
}: {
  title?: string;
  result: PlannerResult;
  formatTime: (segment: PlannerSegment) => string;
  onAddReminder: (segment: PlannerSegment) => void;
  onShare: () => void;
  onCopy: (text: string) => void;
  aiWhy?: string | null;
  aiExtra?: string | null;
  labels: Pick<ChoghadiyaCopy, "avoid" | "add_reminder" | "share" | "copy_text">;
}) {
  const { segment, why } = result;
  const copyText = `${segment.name} (${formatTime(segment)})`;
  const displayWhy = aiWhy ?? why;
  return (
    <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/50 p-4">
      {title && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">{title}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-lg font-serif text-sagar-ink">{segment.name}</span>
        <span className="rounded-full bg-sagar-amber/20 px-2 py-0.5 text-xs uppercase text-sagar-ink/70">
          {isAvoid(segment.name) ? labels.avoid : segment.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-sagar-ink/70">{formatTime(segment)}</p>
      <p className={`mt-2 text-sm ${isAvoid(segment.name) ? "text-sagar-ink/60" : "text-sagar-ink/70"}`}>
        {displayWhy}
      </p>
      {aiExtra && <p className="mt-1 text-sm text-sagar-ink/60">{aiExtra}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/60">
        <button onClick={() => onAddReminder(segment)} className="rounded-full border border-sagar-amber/30 px-3 py-1">
          {labels.add_reminder}
        </button>
        <button onClick={onShare} className="rounded-full border border-sagar-amber/30 px-3 py-1">
          {labels.share}
        </button>
        <button onClick={() => onCopy(copyText)} className="rounded-full border border-sagar-amber/30 px-3 py-1">
          {labels.copy_text}
        </button>
      </div>
    </div>
  );
}

export default function ResultsStep({
  goalLabel,
  cityLabel,
  dateLabel,
  windowLabel,
  windowKey,
  todayISO,
  tomorrowISO,
  best,
  others,
  daily,
  includeAvoid,
  onIncludeAvoidChange,
  onAddReminder,
  onShare,
  onCopy,
  formatTime,
  aiWhy,
  aiExtra,
  onSaveGoal,
  onApply,
  labels
}: Props) {
  if (!best) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-sagar-ink/60">
          {labels.no_good_slots}
        </p>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/60">
          <input
            type="checkbox"
            checked={includeAvoid}
            onChange={(event) => onIncludeAvoidChange(event.target.checked)}
          />
          {labels.include_avoid}
        </label>
      </div>
    );
  }

  const buildCopyText = () => {
    if (windowKey === "week" || windowKey === "month" || windowKey === "custom") {
      const picks = [best, ...others].filter(Boolean).slice(0, 3) as PlannerResult[];
      const lines = [`Best times for ${goalLabel} in ${cityLabel}:`];
      picks.forEach((result) => {
        const label = new Date(`${result.segment.dateISO}T00:00:00Z`).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit"
        });
        lines.push(`- ${label}: ${result.segment.name} (${formatTime(result.segment)})`);
      });
      return lines.join("\n");
    }
    return labels.best_time_for
      .replace("{goal}", goalLabel)
      .replace("{city}", cityLabel)
      .replace("{date}", dateLabel)
      .replace("{slot}", `${best?.segment.name} (${formatTime(best!.segment)})`);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">{labels.results}</p>
        <p className="text-sm text-sagar-ink/70">
          {goalLabel} · {windowLabel} · {cityLabel}
        </p>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/60">
        <input
          type="checkbox"
          checked={includeAvoid}
          onChange={(event) => onIncludeAvoidChange(event.target.checked)}
        />
        {labels.include_avoid}
      </label>
      <ResultCard
        title={labels.best_pick}
        result={best}
        formatTime={formatTime}
        onAddReminder={onAddReminder}
        onShare={onShare}
        onCopy={(text) => onCopy(buildCopyText())}
        aiWhy={aiWhy}
        aiExtra={aiExtra}
        labels={labels}
      />
      {onApply && (
        <button
          onClick={() => onApply(best.segment)}
          className="w-full rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70"
        >
          {labels.apply_to_timetable}
        </button>
      )}
      {onSaveGoal && (
        <button
          onClick={onSaveGoal}
          className="w-full rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70"
        >
          {labels.save_plan}
        </button>
      )}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">{labels.other_good_options}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {others.map((result) => (
              <ResultCard
                key={`${result.segment.name}-${result.segment.start.toISOString()}`}
                result={result}
                formatTime={formatTime}
                onAddReminder={onAddReminder}
                onShare={onShare}
                onCopy={(text) => onCopy(buildCopyText())}
                labels={labels}
              />
            ))}
          </div>
        </div>
      )}

      {(windowKey === "week" || windowKey === "month" || windowKey === "custom") && daily.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">{labels.daily_best_slots}</p>
          {daily.map((day) => {
            const isOpen = day.dateISO === todayISO || day.dateISO === tomorrowISO;
            const dateLabel = new Date(`${day.dateISO}T00:00:00Z`).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit"
            });
            return (
              <details key={day.dateISO} open={isOpen} className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-sagar-ink">{dateLabel}</summary>
                <div className="mt-3 space-y-2 text-sm text-sagar-ink/70">
                  {day.day && (
                    <div>
                      <span className="font-semibold text-sagar-ink">{labels.best_daytime}:</span>{" "}
                      {day.day.segment.name} ({formatTime(day.day.segment)})
                    </div>
                  )}
                  {day.night && (
                    <div>
                      <span className="font-semibold text-sagar-ink">{labels.best_night}:</span>{" "}
                      {day.night.segment.name} ({formatTime(day.night.segment)})
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
