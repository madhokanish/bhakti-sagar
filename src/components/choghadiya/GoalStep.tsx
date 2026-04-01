"use client";

import { GoalKey, goalOptions } from "@/lib/choghadiyaPlanner";
import type { ChoghadiyaCopy } from "@/lib/choghadiyaCopy";

type Props = {
  value?: GoalKey;
  onChange: (goal: GoalKey) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  labels: Pick<ChoghadiyaCopy, "step1_title" | "select_goal" | "choose_goal" | "goal_other">;
  options?: Array<{ key: GoalKey; label: string }>;
};

export default function GoalStep({ value, onChange, otherValue, onOtherChange, labels, options }: Props) {
  const resolvedOptions = options ?? goalOptions;
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-sagar-ink">{labels.step1_title}</p>
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
        {labels.select_goal}
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value as GoalKey)}
          className="mt-2 w-full rounded-2xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            {labels.choose_goal}
          </option>
          {resolvedOptions.map((goal) => (
            <option key={goal.key} value={goal.key}>
              {goal.label}
            </option>
          ))}
        </select>
      </label>
      {value === "other" && (
        <input
          value={otherValue ?? ""}
          onChange={(event) => onOtherChange?.(event.target.value)}
          placeholder={labels.goal_other}
          className="w-full rounded-2xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
