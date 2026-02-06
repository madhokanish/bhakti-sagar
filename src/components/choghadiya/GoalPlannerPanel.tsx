"use client";

import { useEffect, useRef, useState } from "react";
import {
  GoalKey,
  WindowKey,
  PlannerResult,
  PlannerSegment,
  addDaysISO,
  computeSegmentsForRange,
  filterSegmentsByWindow,
  getDateRangeISOs,
  getEndOfIsoWeekDate,
  getEndOfMonthDate,
  parseDateTimeLocal,
  rankSegments
} from "@/lib/choghadiyaPlanner";
import GoalStep from "@/components/choghadiya/GoalStep";
import WhenStep from "@/components/choghadiya/WhenStep";
import ResultsStep from "@/components/choghadiya/ResultsStep";
import { getLocalDateISO, toUTCDateFromLocal } from "@/lib/choghadiya";

export type PlannerParams = {
  goal?: string;
  window?: string;
  start?: string;
  end?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "auto" | "manual";
  tz: string;
  dateISO: string;
  lat: number | null;
  lon: number | null;
  cityLabel: string;
  sunTimes: { sunrise: Date; sunset: Date; nextSunrise: Date } | null;
  segments: PlannerSegment[];
  plannerParams: PlannerParams;
  onPlannerParamsChange: (params: PlannerParams) => void;
  onAddReminder: (segment: PlannerSegment) => void;
  formatTime: (segment: PlannerSegment) => string;
};

type DailyResult = {
  dateISO: string;
  day?: PlannerResult;
  night?: PlannerResult;
};

const goalLabels: Record<GoalKey, string> = {
  travel: "Travel",
  puja: "Puja",
  start_work: "Start work or task",
  start_business: "Start business",
  buy_vehicle: "Buy vehicle",
  study: "Study or learning",
  ceremony: "Ceremony",
  marriage: "Marriage",
  other: "Other"
};

const windowLabels: Record<WindowKey, string> = {
  "3h": "Next 3 hours",
  "6h": "Next 6 hours",
  day: "Today (daytime)",
  night: "Tonight",
  week: "This week",
  month: "This month",
  custom: "Custom range"
};

function getWindowStartEnd({
  windowKey,
  dateISO,
  tz,
  sunTimes,
  customStart,
  customEnd
}: {
  windowKey: WindowKey;
  dateISO: string;
  tz: string;
  sunTimes: { sunrise: Date; sunset: Date; nextSunrise: Date } | null;
  customStart?: string;
  customEnd?: string;
}) {
  const nowMs = Date.now();
  const todayISO = getLocalDateISO(tz);
  const isToday = todayISO === dateISO;

  if (windowKey === "3h" || windowKey === "6h") {
    const hours = windowKey === "3h" ? 3 : 6;
    return {
      startMs: nowMs,
      endMs: nowMs + hours * 3600000,
      startISO: dateISO,
      endISO: dateISO
    };
  }

  if (!sunTimes && (windowKey === "day" || windowKey === "night")) {
    return null;
  }

  if (windowKey === "day") {
    return {
      startMs: sunTimes!.sunrise.getTime(),
      endMs: sunTimes!.sunset.getTime(),
      startISO: dateISO,
      endISO: dateISO
    };
  }

  if (windowKey === "night") {
    return {
      startMs: sunTimes!.sunset.getTime(),
      endMs: sunTimes!.nextSunrise.getTime(),
      startISO: dateISO,
      endISO: dateISO
    };
  }

  if (windowKey === "week") {
    const endISO = getEndOfIsoWeekDate(dateISO);
    const startMs = isToday
      ? nowMs
      : toUTCDateFromLocal({ dateISO, time: "00:00", timeZone: tz }).getTime();
    const endMs =
      toUTCDateFromLocal({ dateISO: endISO, time: "23:59", timeZone: tz }).getTime() + 59000;
    return { startMs, endMs, startISO: dateISO, endISO };
  }

  if (windowKey === "month") {
    const endISO = getEndOfMonthDate(dateISO);
    const startMs = isToday
      ? nowMs
      : toUTCDateFromLocal({ dateISO, time: "00:00", timeZone: tz }).getTime();
    const endMs =
      toUTCDateFromLocal({ dateISO: endISO, time: "23:59", timeZone: tz }).getTime() + 59000;
    return { startMs, endMs, startISO: dateISO, endISO };
  }

  if (windowKey === "custom") {
    const start = parseDateTimeLocal(customStart);
    const end = parseDateTimeLocal(customEnd);
    if (!start || !end) return null;
    const startMs = toUTCDateFromLocal({ dateISO: start.dateISO, time: start.time, timeZone: tz }).getTime();
    const endMs = toUTCDateFromLocal({ dateISO: end.dateISO, time: end.time, timeZone: tz }).getTime();
    return {
      startMs,
      endMs,
      startISO: start.dateISO,
      endISO: end.dateISO
    };
  }

  return null;
}

async function fetchAiWhy(payload: Record<string, string>) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch("/api/choghadiya/ai-why", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!res.ok) throw new Error("AI unavailable");
    const data = await res.json();
    return data;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function GoalPlannerPanel({
  open,
  onClose,
  mode,
  tz,
  dateISO,
  lat,
  lon,
  cityLabel,
  sunTimes,
  segments,
  plannerParams,
  onPlannerParamsChange,
  onAddReminder,
  formatTime
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setGoal] = useState<GoalKey | undefined>(plannerParams.goal as GoalKey);
  const [windowKey, setWindowKey] = useState<WindowKey | undefined>(plannerParams.window as WindowKey);
  const [customStart, setCustomStart] = useState<string | undefined>(plannerParams.start);
  const [customEnd, setCustomEnd] = useState<string | undefined>(plannerParams.end);
  const [otherGoal, setOtherGoal] = useState("");
  const [includeAvoid, setIncludeAvoid] = useState(false);
  const [results, setResults] = useState<PlannerResult[]>([]);
  const [dailyResults, setDailyResults] = useState<DailyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiWhy, setAiWhy] = useState<string | null>(null);
  const [aiExtra, setAiExtra] = useState<string | null>(null);
  const rangeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (plannerParams.goal) setGoal(plannerParams.goal as GoalKey);
    if (plannerParams.window) setWindowKey(plannerParams.window as WindowKey);
    if (plannerParams.start) setCustomStart(plannerParams.start);
    if (plannerParams.end) setCustomEnd(plannerParams.end);
  }, [plannerParams.goal, plannerParams.window, plannerParams.start, plannerParams.end]);

  useEffect(() => {
    if (!open) return;
    if (goal && windowKey) {
      setStep(3);
    } else if (goal) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [open, goal, windowKey]);

  const goalLabel = goal
    ? goal === "other" && otherGoal
      ? otherGoal
      : goalLabels[goal]
    : "";
  const windowLabel = windowKey ? windowLabels[windowKey] : "";
  const dateLabel = new Date(`${dateISO}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
  const todayISO = getLocalDateISO(tz);
  const tomorrowISO = addDaysISO(todayISO, 1);
  const autoEnabled = mode === "auto";
  const allowRange = autoEnabled;

  // no derived memo needed here

  useEffect(() => {
    onPlannerParamsChange({
      goal,
      window: windowKey,
      start: customStart,
      end: customEnd
    });
  }, [goal, windowKey, customStart, customEnd, onPlannerParamsChange]);

  useEffect(() => {
    if (!open || step !== 3 || !goal || !windowKey) return;
    setError(null);
    setLoading(true);
    setAiWhy(null);
    setAiExtra(null);
    setResults([]);
    setDailyResults([]);
    rangeAbortRef.current?.abort();
    const controller = new AbortController();
    rangeAbortRef.current = controller;

    const compute = async () => {
      const windowConfig = getWindowStartEnd({
        windowKey,
        dateISO,
        tz,
        sunTimes,
        customStart,
        customEnd
      });

      if (!windowConfig) {
        setError("Select a valid time window to continue.");
        setLoading(false);
        return;
      }

      if ((windowKey === "week" || windowKey === "month" || windowKey === "custom") && !allowRange) {
        setError("Week and month need automatic sunrise and sunset.");
        setLoading(false);
        return;
      }

      const { startMs, endMs, startISO, endISO } = windowConfig;

      if (endMs <= startMs) {
        setError("End time must be after start time.");
        setLoading(false);
        return;
      }

      if ((windowKey === "week" || windowKey === "month" || windowKey === "custom") && (!lat || !lon)) {
        setError("Select a city or use your location to compute sunrise and sunset.");
        setLoading(false);
        return;
      }

      let windowSegments: PlannerSegment[] = [];
      let timedOut = false;

      const crossDayShortWindow =
        (windowKey === "3h" || windowKey === "6h") &&
        sunTimes &&
        endMs > sunTimes.nextSunrise.getTime();

      if (crossDayShortWindow && (!lat || !lon || !allowRange)) {
        setError("Select a city to compute slots that cross into the next day.");
        setLoading(false);
        return;
      }

      if (windowKey === "week" || windowKey === "month" || windowKey === "custom" || crossDayShortWindow) {
        if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_range_compute_started");
        const rangeStartISO = startISO;
        const rangeEndISO = crossDayShortWindow ? addDaysISO(startISO, 1) : endISO;
        const range = await computeSegmentsForRange({
          startISO: rangeStartISO,
          endISO: rangeEndISO,
          lat: lat!,
          lon: lon!,
          tz,
          signal: controller.signal,
          timeBudgetMs: 5000
        });
        windowSegments = filterSegmentsByWindow(range.segments, startMs, endMs);
        timedOut = range.timedOut;
      } else {
        windowSegments = filterSegmentsByWindow(segments, startMs, endMs);
      }

      const rankingStartMs = Math.max(startMs, Date.now());
      const ranked = rankSegments({
        segments: windowSegments,
        goal,
        windowStartMs: rankingStartMs,
        includeAvoid
      });

      setResults(ranked);

      if (windowKey === "week" || windowKey === "month" || windowKey === "custom") {
        const dates = getDateRangeISOs(startISO, endISO);
        const daily: DailyResult[] = dates.map((date) => {
          const dateSegments = windowSegments.filter((segment) => segment.dateISO === date);
          const daySegments = dateSegments.filter((segment) => segment.isDay);
          const nightSegments = dateSegments.filter((segment) => !segment.isDay);
          const dayBest = rankSegments({
            segments: daySegments,
            goal,
            windowStartMs: startMs,
            includeAvoid,
            limit: 1
          })[0];
          const nightBest = rankSegments({
            segments: nightSegments,
            goal,
            windowStartMs: startMs,
            includeAvoid,
            limit: 1
          })[0];
          return { dateISO: date, day: dayBest, night: nightBest };
        });
        setDailyResults(daily);
      } else {
        setDailyResults([]);
      }

      setLoading(false);

      const best = ranked[0];
      if (best) {
        try {
          const ai = await fetchAiWhy({
            city: cityLabel,
            tz,
            date: dateISO,
            goal: goalLabel,
            window: windowLabel,
            slot: best.segment.name,
            start: formatTime(best.segment),
            label: best.segment.label
          });
          if (ai?.why) {
            setAiWhy(ai.why);
            setAiExtra(ai.extra ?? null);
            if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_ai_used");
          }
        } catch {
          if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_ai_fallback_used");
        }
      }

      if ((windowKey === "week" || windowKey === "month" || windowKey === "custom" || crossDayShortWindow) && (window as any).gtag) {
        (window as any).gtag("event", "choghadiya_planner_range_compute_completed");
      }

      if (timedOut) {
        setError("Showing partial results. Try narrowing the range if needed.");
      }

      if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_results_shown");
    };

    compute();

    return () => {
      controller.abort();
    };
  }, [
    open,
    step,
    goal,
    windowKey,
    includeAvoid,
    dateISO,
    tz,
    lat,
    lon,
    customStart,
    customEnd,
    segments,
    sunTimes,
    allowRange,
    cityLabel,
    formatTime,
    goalLabel,
    windowLabel
  ]);

  function handleGoalSelect(value: GoalKey) {
    setGoal(value);
    if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_goal_selected");
  }

  function handleWindowSelect(value: WindowKey) {
    setWindowKey(value);
    if (value !== "custom") {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
    if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_window_selected");
  }

  function handleCustomChange(values: { start?: string; end?: string }) {
    if (values.start !== undefined) setCustomStart(values.start);
    if (values.end !== undefined) setCustomEnd(values.end);
  }

  const best = results[0];
  const others = results.slice(1, 3);

  const shareAction = () => {
    navigator.clipboard.writeText(window.location.href);
    if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_share_clicked");
  };

  const copyAction = (text: string) => {
    navigator.clipboard.writeText(text);
    if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_copy_clicked");
  };

  const panelClasses =
    "fixed z-50 bg-white shadow-sagar-card transition-transform duration-200 ease-out";
  const mobileClasses =
    "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border border-sagar-amber/20 p-5 md:hidden";
  const desktopClasses =
    "hidden md:block top-0 right-0 h-full w-[380px] border-l border-sagar-amber/20 p-6";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`${panelClasses} ${mobileClasses} ${open ? "translate-y-0" : "translate-y-full pointer-events-none"}`}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-sagar-ink">AI Goal Planner</p>
          <button onClick={onClose} className="text-sm text-sagar-ink/60">Close</button>
        </div>

        <div className="mt-4 space-y-6 overflow-y-auto pb-6">
          {step === 1 && (
            <>
              <GoalStep
                value={goal}
                onChange={handleGoalSelect}
                otherValue={otherGoal}
                onOtherChange={setOtherGoal}
              />
              <button
                disabled={!goal}
                onClick={() => setStep(2)}
                className="w-full rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                Next
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <WhenStep
                value={windowKey}
                onChange={handleWindowSelect}
                customStart={customStart}
                customEnd={customEnd}
                onCustomChange={handleCustomChange}
                autoEnabled={autoEnabled}
                timeZoneLabel={tz}
              />
              <button
                disabled={!windowKey || (windowKey === "custom" && !customStart) || (windowKey === "custom" && !customEnd)}
                onClick={() => setStep(3)}
                className="w-full rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                Show best times
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <ResultsStep
                goalLabel={goalLabel}
                cityLabel={cityLabel}
                windowLabel={windowLabel}
                windowKey={windowKey!}
                dateLabel={dateLabel}
                todayISO={todayISO}
                tomorrowISO={tomorrowISO}
                best={best}
                others={others}
                daily={dailyResults}
                includeAvoid={includeAvoid}
                onIncludeAvoidChange={(value) => {
                  setIncludeAvoid(value);
                  if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_include_avoid_toggled");
                }}
                onAddReminder={onAddReminder}
                onShare={shareAction}
                onCopy={copyAction}
                formatTime={formatTime}
                aiWhy={aiWhy}
                aiExtra={aiExtra}
              />
              {loading && (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 w-32 rounded-full bg-sagar-cream/70" />
                  <div className="h-6 w-full rounded-2xl bg-sagar-cream/60" />
                </div>
              )}
              {error && <p className="text-sm text-sagar-crimson">{error}</p>}
            </>
          )}
        </div>
      </div>

      <div
        className={`${panelClasses} ${desktopClasses} ${open ? "translate-x-0" : "translate-x-full pointer-events-none"}`}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-sagar-ink">AI Goal Planner</p>
          <button onClick={onClose} className="text-sm text-sagar-ink/60">Close</button>
        </div>
        <div className="mt-6 space-y-6 overflow-y-auto">
          {step === 1 && (
            <>
              <GoalStep
                value={goal}
                onChange={handleGoalSelect}
                otherValue={otherGoal}
                onOtherChange={setOtherGoal}
              />
              <button
                disabled={!goal}
                onClick={() => setStep(2)}
                className="w-full rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                Next
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <WhenStep
                value={windowKey}
                onChange={handleWindowSelect}
                customStart={customStart}
                customEnd={customEnd}
                onCustomChange={handleCustomChange}
                autoEnabled={autoEnabled}
                timeZoneLabel={tz}
              />
              <button
                disabled={!windowKey || (windowKey === "custom" && !customStart) || (windowKey === "custom" && !customEnd)}
                onClick={() => setStep(3)}
                className="w-full rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                Show best times
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <ResultsStep
                goalLabel={goalLabel}
                cityLabel={cityLabel}
                windowLabel={windowLabel}
                windowKey={windowKey!}
                dateLabel={dateLabel}
                todayISO={todayISO}
                tomorrowISO={tomorrowISO}
                best={best}
                others={others}
                daily={dailyResults}
                includeAvoid={includeAvoid}
                onIncludeAvoidChange={(value) => {
                  setIncludeAvoid(value);
                  if ((window as any).gtag) (window as any).gtag("event", "choghadiya_planner_include_avoid_toggled");
                }}
                onAddReminder={onAddReminder}
                onShare={shareAction}
                onCopy={copyAction}
                formatTime={formatTime}
                aiWhy={aiWhy}
                aiExtra={aiExtra}
              />
              {loading && (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 w-32 rounded-full bg-sagar-cream/70" />
                  <div className="h-6 w-full rounded-2xl bg-sagar-cream/60" />
                </div>
              )}
              {error && <p className="text-sm text-sagar-crimson">{error}</p>}
            </>
          )}
        </div>
      </div>
    </>
  );
}
