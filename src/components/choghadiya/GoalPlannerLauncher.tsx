"use client";

type Props = {
  onOpen: () => void;
};

export default function GoalPlannerLauncher({ onOpen }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sagar-amber/20 bg-white px-4 py-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-sagar-ink">AI Goal Planner</p>
          <span className="rounded-full bg-sagar-amber/20 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70">
            Beta
          </span>
        </div>
        <p className="text-xs text-sagar-ink/60">Pick goal + when, get the best slots</p>
      </div>
      <button
        onClick={onOpen}
        className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
      >
        Plan a good time
      </button>
    </div>
  );
}
