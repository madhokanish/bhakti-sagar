"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  cutoffAtIso: string;
  rolledToNextWeek?: boolean;
};

function getRemaining(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalMs: diff, days, hours, minutes, seconds };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function CutoffCountdown({ cutoffAtIso, rolledToNextWeek = false }: Props) {
  const [remaining, setRemaining] = useState(() => getRemaining(cutoffAtIso));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemaining(cutoffAtIso));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cutoffAtIso]);

  const label = useMemo(() => {
    if (remaining.totalMs <= 0) return "Name submission window closed";
    if (rolledToNextWeek) return "Cutoff passed for this week, next week is open";
    return "Name submission cutoff";
  }, [remaining.totalMs, rolledToNextWeek]);

  return (
    <div className="rounded-xl border border-sagar-amber/30 bg-sagar-cream/55 p-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">{label}</p>
      <p className="mt-1 text-sm font-semibold text-sagar-ink">
        {remaining.totalMs > 0
          ? `${remaining.days}d ${pad(remaining.hours)}h ${pad(remaining.minutes)}m ${pad(remaining.seconds)}s`
          : "Join upcoming cycle"}
      </p>
    </div>
  );
}
