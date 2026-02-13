"use client";

import { useEffect, useMemo, useState } from "react";
import { getNextPujaOccurrence, type WeeklyDay } from "@/lib/onlinePuja";

type Props = {
  weeklyDay: WeeklyDay;
  startTime: string;
  timeZone: string;
  scheduleTimeZone?: string;
  displayTimeZone?: string;
  compact?: boolean;
  className?: string;
};

function splitDuration(ms: number) {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return { days, hours, minutes, seconds };
}

function formatParts(value: number) {
  return value.toString().padStart(2, "0");
}

export default function PujaCountdownCard({
  weeklyDay,
  startTime,
  timeZone,
  scheduleTimeZone,
  displayTimeZone,
  compact = false,
  className = ""
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const scheduleTz = scheduleTimeZone || timeZone;
  const displayTz = displayTimeZone || timeZone;

  const nextOccurrence = useMemo(() => {
    return getNextPujaOccurrence({
      weeklyDay,
      startTime,
      timeZone: scheduleTz,
      now: new Date(now)
    });
  }, [now, scheduleTz, startTime, weeklyDay]);

  const duration = splitDuration(nextOccurrence.getTime() - now);
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: displayTz
  }).format(nextOccurrence);

  return (
    <div
      className={`rounded-2xl border border-sagar-amber/25 bg-white/90 ${
        compact ? "p-3" : "p-4"
      } ${className}`}
      aria-live="polite"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sagar-rose">
        Next Weekly Seva
      </p>
      <p className={`mt-1 text-sagar-ink ${compact ? "text-xl" : "text-2xl"}`}>
        {formattedDate}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2.5">
        {[
          { key: "Days", value: duration.days },
          { key: "Hours", value: duration.hours },
          { key: "Mins", value: duration.minutes },
          { key: "Secs", value: duration.seconds }
        ].map((part) => (
          <div
            key={part.key}
            className="rounded-xl border border-sagar-amber/20 bg-sagar-sand/55 px-2 py-2 text-center"
          >
            <p className="text-lg font-semibold text-sagar-ink">{formatParts(part.value)}</p>
            <p className="text-[0.58rem] uppercase tracking-[0.15em] text-sagar-ink/60">{part.key}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
