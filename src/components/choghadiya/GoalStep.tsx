"use client";

import { GoalKey, goalOptions } from "@/lib/choghadiyaPlanner";

type Props = {
  value?: GoalKey;
  onChange: (goal: GoalKey) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
};

export default function GoalStep({ value, onChange, otherValue, onOtherChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-sagar-ink">Step 1 · What goal?</p>
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
        Select goal
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value as GoalKey)}
          className="mt-2 w-full rounded-2xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Choose a goal
          </option>
          {goalOptions.map((goal) => (
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
          placeholder="Optional: describe your goal"
          className="w-full rounded-2xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
