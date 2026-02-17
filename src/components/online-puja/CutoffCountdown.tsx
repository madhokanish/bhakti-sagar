"use client";

import { useEffect, useState } from "react";

type Props = {
  cutoffAt: Date;
  /** Compact mode shows single line e.g. "2d 17h left" */
  compact?: boolean;
  /** Urgent mode applies pulsing when under 24h */
  urgent?: boolean;
};

function getParts(cutoffAt: Date) {
  const diff = cutoffAt.getTime() - Date.now();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { expired: false, days, hours, minutes };
}

export default function CutoffCountdown({ cutoffAt, compact, urgent }: Props) {
  const [parts, setParts] = useState(() => getParts(cutoffAt));
  const isUrgent = urgent && !parts.expired && parts.days === 0 && parts.hours < 24;

  useEffect(() => {
    setParts(getParts(cutoffAt));
    const interval = isUrgent ? 10000 : 60000; // 10s when under 24h, else 1min
    const timer = setInterval(() => setParts(getParts(cutoffAt)), interval);
    return () => clearInterval(timer);
  }, [cutoffAt, isUrgent]);

  if (parts.expired) {
    return (
      <span className="rounded-lg bg-sagar-rose/20 px-2 py-1 text-sm font-semibold text-sagar-rose">
        Cutoff passed — join for next Saturday
      </span>
    );
  }

  if (compact) {
    const text =
      parts.days > 0
        ? `${parts.days}d ${parts.hours}h left`
        : parts.hours > 0
          ? `${parts.hours}h ${parts.minutes}m left`
          : `${parts.minutes}m left`;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold ${
          isUrgent
            ? "animate-pulse bg-sagar-rose/25 text-sagar-rose"
            : "bg-sagar-amber/30 text-sagar-ink"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
        {text}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
        isUrgent
          ? "animate-pulse border-sagar-rose/40 bg-sagar-rose/15"
          : "border-sagar-amber/35 bg-black/20"
      }`}
      role="timer"
      aria-live="polite"
      aria-label={`Cutoff in ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes`}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-sagar-amber">
        Names close in
      </span>
      <div className="flex gap-2 font-mono">
        {parts.days > 0 && (
          <span className="flex flex-col items-center">
            <span className="text-xl font-bold text-[#f7e7cf] tabular-nums">{parts.days}</span>
            <span className="text-[0.65rem] uppercase text-[#f2d8ba]/80">days</span>
          </span>
        )}
        <span className="flex flex-col items-center">
          <span className="text-xl font-bold text-[#f7e7cf] tabular-nums">{parts.hours}</span>
          <span className="text-[0.65rem] uppercase text-[#f2d8ba]/80">hrs</span>
        </span>
        <span className="flex flex-col items-center">
          <span className="text-xl font-bold text-[#f7e7cf] tabular-nums">{parts.minutes}</span>
          <span className="text-[0.65rem] uppercase text-[#f2d8ba]/80">min</span>
        </span>
      </div>
    </div>
  );
}
