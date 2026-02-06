"use client";

import { useMemo } from "react";
import { addDaysISO } from "@/lib/choghadiyaPlanner";

type Props = {
  dateISO: string;
  tz: string;
  onDateChange: (value: string) => void;
};

function formatPill(dateISO: string, tz: string) {
  const date = new Date(`${dateISO}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(date);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, day: "2-digit" }).format(date);
  return { weekday, day };
}

export default function SwipeDateStrip({ dateISO, tz, onDateChange }: Props) {
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDaysISO(dateISO, index - 3));
  }, [dateISO]);

  return (
    <div className="overflow-x-auto px-1">
      <div className="flex min-w-max gap-2 py-2">
        {dates.map((date) => {
          const { weekday, day } = formatPill(date, tz);
          const active = date === dateISO;
          return (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`flex min-w-[56px] flex-col items-center rounded-2xl px-3 py-2 text-xs ${
                active
                  ? "bg-sagar-saffron text-white"
                  : "border border-sagar-amber/30 bg-white text-sagar-ink/70"
              }`}
              aria-label={`${weekday} ${day}`}
            >
              <span className="text-[0.6rem] uppercase tracking-wide">{weekday}</span>
              <span className="text-sm font-semibold">{day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
