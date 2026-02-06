"use client";

import { useEffect, useRef, useState } from "react";
import { ChoghadiyaSegment } from "@/lib/choghadiya";
import DayTable from "@/components/choghadiya/DayTable";
import NightTable from "@/components/choghadiya/NightTable";

type Props = {
  dateLabel: string;
  sunrise: Date | null;
  sunset: Date | null;
  nextSunrise: Date | null;
  daySegments: ChoghadiyaSegment[];
  nightSegments: ChoghadiyaSegment[];
  currentSegment: ChoghadiyaSegment | null;
  selectedTimeMs?: number | null;
  timeZone: string;
  baseDateKey: string;
  onAddReminder: (segment: ChoghadiyaSegment) => void;
  onCopyTime: (text: string) => void;
  activePane: "day" | "night";
  onPaneChange: (pane: "day" | "night") => void;
};

export default function TimetablePane({
  dateLabel,
  sunrise,
  sunset,
  nextSunrise,
  daySegments,
  nightSegments,
  currentSegment,
  selectedTimeMs,
  timeZone,
  baseDateKey,
  onAddReminder,
  onCopyTime,
  activePane,
  onPaneChange
}: Props) {
  const [splitView, setSplitView] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const [canSplit, setCanSplit] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setCanSplit(width >= 640 && width < 1024);
      setIsDesktop(width >= 1024);
      if (width < 640) setSplitView(false);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60 md:hidden">
        <div className="flex gap-2 rounded-full border border-sagar-amber/20 bg-white p-1">
          <button
            onClick={() => onPaneChange("day")}
            className={`rounded-full px-3 py-1 text-[0.65rem] ${
              activePane === "day" ? "bg-sagar-saffron text-white" : "text-sagar-ink/60"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => onPaneChange("night")}
            className={`rounded-full px-3 py-1 text-[0.65rem] ${
              activePane === "night" ? "bg-sagar-saffron text-white" : "text-sagar-ink/60"
            }`}
          >
            Night
          </button>
        </div>
        {canSplit && (
          <button
            onClick={() => setSplitView((prev) => !prev)}
            className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/60"
          >
            {splitView ? "Single" : "Split"}
          </button>
        )}
      </div>

      <div
        className={`md:grid md:grid-cols-2 md:gap-4 ${splitView ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}`}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (splitView) return;
          const start = touchStartX.current;
          if (start == null) return;
          const end = event.changedTouches[0]?.clientX ?? start;
          const delta = end - start;
          if (Math.abs(delta) < 50) return;
          onPaneChange(delta < 0 ? "night" : "day");
        }}
      >
        {(splitView || activePane === "day" || isDesktop) && (
          <DayTable
            dateLabel={dateLabel}
            sunrise={sunrise}
            sunset={sunset}
            segments={daySegments}
            currentSegment={currentSegment}
            selectedTimeMs={selectedTimeMs}
            timeZone={timeZone}
            baseDateKey={baseDateKey}
            onAddReminder={onAddReminder}
            onCopyTime={onCopyTime}
          />
        )}
        {(splitView || activePane === "night" || isDesktop) && (
          <NightTable
            dateLabel={dateLabel}
            sunset={sunset}
            nextSunrise={nextSunrise}
            segments={nightSegments}
            currentSegment={currentSegment}
            selectedTimeMs={selectedTimeMs}
            timeZone={timeZone}
            baseDateKey={baseDateKey}
            onAddReminder={onAddReminder}
            onCopyTime={onCopyTime}
          />
        )}
      </div>
    </div>
  );
}
