"use client";

type Props = {
  onOpen: () => void;
};

export default function GoalPlannerLauncher({ onOpen }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sagar-amber/20 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-sagar-ink">Plan a good time</p>
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
