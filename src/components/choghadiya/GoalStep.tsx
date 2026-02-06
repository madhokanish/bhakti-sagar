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
      <div className="flex gap-2 overflow-x-auto pb-2">
        {goalOptions.map((goal) => (
          <button
            key={goal.key}
            onClick={() => onChange(goal.key)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              value === goal.key
                ? "border-sagar-saffron bg-sagar-saffron text-white"
                : "border-sagar-amber/30 bg-white text-sagar-ink/70"
            }`}
          >
            {goal.label}
          </button>
        ))}
      </div>
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
