"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChoghadiyaSegment,
  computeSegments,
  formatTimeInput,
  formatTimeWithDay,
  getDateKey,
  getLocalDateISO,
  getWeekdayForDate,
  toUTCDateFromLocal
} from "@/lib/choghadiya";
import { cities, CityOption } from "@/lib/choghadiyaCities";
import GoalPlannerPanel, { type PlannerParams } from "@/components/choghadiya/GoalPlannerPanel";
import DateController from "@/components/choghadiya/DateController";
import CurrentSlotCard from "@/components/choghadiya/CurrentSlotCard";
import TimetablePane from "@/components/choghadiya/TimetablePane";
import Legend from "@/components/choghadiya/Legend";
import TimelineBar from "@/components/choghadiya/TimelineBar";
import { PlannerSegment } from "@/lib/choghadiyaPlanner";
import { addDaysISO } from "@/lib/choghadiyaPlanner";

type SunTimes = {
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
};

type Props = {
  initialCity?: CityOption;
  initialCityName?: string;
  initialLat?: number | null;
  initialLon?: number | null;
  initialDate: string;
  initialTz: string;
  initialMode?: "auto" | "manual";
  initialSunrise?: string;
  initialSunset?: string;
  initialNextSunrise?: string;
  initialPathBase?: string;
  hasTzParam?: boolean;
  hasDateParam?: boolean;
  initialPlannerGoal?: string;
  initialPlannerWindow?: string;
  initialPlannerStart?: string;
  initialPlannerEnd?: string;
  initialPane?: "day" | "night";
};

export default function ChoghadiyaClient({
  initialCity,
  initialCityName,
  initialLat,
  initialLon,
  initialDate,
  initialTz,
  initialMode = "auto",
  initialSunrise = "",
  initialSunset = "",
  initialNextSunrise = "",
  initialPathBase = "/choghadiya",
  hasTzParam = false,
  hasDateParam = false,
  initialPlannerGoal,
  initialPlannerWindow,
  initialPlannerStart,
  initialPlannerEnd,
  initialPane = "day"
}: Props) {
  const pathname = usePathname();
  const [cityInput, setCityInput] = useState(initialCityName ?? initialCity?.name ?? "");
  const [tz, setTz] = useState(initialTz);
  const [dateISO, setDateISO] = useState(initialDate);
  const [lat, setLat] = useState<number | null>(initialLat ?? initialCity?.lat ?? null);
  const [lon, setLon] = useState<number | null>(initialLon ?? initialCity?.lon ?? null);
  const [mode, setMode] = useState<"auto" | "manual">(initialMode);
  const [sunrise, setSunrise] = useState<string>(initialSunrise);
  const [sunset, setSunset] = useState<string>(initialSunset);
  const [nextSunrise, setNextSunrise] = useState<string>(initialNextSunrise);
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualHint, setManualHint] = useState<string | null>(null);
  const [selectedTimeMs, setSelectedTimeMs] = useState<number | null>(null);
  const [timeZones, setTimeZones] = useState<string[]>([]);
  const [pathBase, setPathBase] = useState(initialPathBase);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerParams, setPlannerParams] = useState<PlannerParams>({
    goal: initialPlannerGoal,
    window: initialPlannerWindow,
    start: initialPlannerStart,
    end: initialPlannerEnd
  });
  const [activePane, setActivePane] = useState<"day" | "night">(initialPane);
  const [isDateAutoSet, setIsDateAutoSet] = useState(false);

  useEffect(() => {
    try {
      if (typeof Intl.supportedValuesOf === "function") {
        setTimeZones(Intl.supportedValuesOf("timeZone"));
      }
    } catch {
      setTimeZones([]);
    }
  }, []);

  useEffect(() => {
    if (mode === "manual") return;
    if (lat == null || lon == null) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const fetchSun = async () => {
        setLoading(true);
        setError(null);
        setManualHint(null);
        try {
          const res = await fetch(
            `/api/choghadiya/sun?lat=${lat}&lon=${lon}&date=${dateISO}&tz=${encodeURIComponent(tz)}`,
            {
              signal: controller.signal
            }
          );
          const data = await res.json();
          if (!res.ok) {
            if (res.status === 422) {
              setError(data?.error ?? "Sunrise/sunset unavailable for this location.");
              setManualHint("Sunrise/sunset unavailable. Enter times manually.");
              setMode("manual");
            } else {
              setError(data?.error ?? "Unable to load times.");
            }
            setSunTimes(null);
            return;
          }
          setSunTimes({
            sunrise: new Date(data.sunrise),
            sunset: new Date(data.sunset),
            nextSunrise: new Date(data.nextSunrise)
          });
          setSunrise(formatTimeInput(new Date(data.sunrise), tz));
          setSunset(formatTimeInput(new Date(data.sunset), tz));
          setNextSunrise(formatTimeInput(new Date(data.nextSunrise), tz));
        } catch {
          setError("Unable to load times.");
          setSunTimes(null);
        } finally {
          setLoading(false);
        }
      };
      fetchSun();
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [lat, lon, dateISO, tz, mode]);

  useEffect(() => {
    if (mode !== "manual") return;
    if (!sunrise || !sunset) {
      setSunTimes(null);
      return;
    }
    const sunriseDate = toUTCDateFromLocal({ dateISO, time: sunrise, timeZone: tz });
    const sunsetDate = toUTCDateFromLocal({ dateISO, time: sunset, timeZone: tz });
    let nextSunriseDate: Date | null = null;
    if (nextSunrise) {
      nextSunriseDate = toUTCDateFromLocal({
        dateISO,
        time: nextSunrise,
        timeZone: tz
      });
    }
    const setTimes = (value: Date | null) => {
      if (!value) {
        setSunTimes(null);
        return;
      }
      setSunTimes({ sunrise: sunriseDate, sunset: sunsetDate, nextSunrise: value });
    };

    if (nextSunriseDate) {
      setManualHint(null);
      setTimes(nextSunriseDate);
      return;
    }

    if (lat != null && lon != null) {
      setLoading(true);
      setManualHint(null);
      fetch(`/api/choghadiya/sun?lat=${lat}&lon=${lon}&date=${dateISO}&tz=${encodeURIComponent(tz)}`)
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (!ok || !data?.nextSunrise) {
            setManualHint("Enter the next sunrise time to finish manual mode.");
            setTimes(null);
            return;
          }
          setTimes(new Date(data.nextSunrise));
        })
        .catch(() => {
          setManualHint("Enter the next sunrise time to finish manual mode.");
          setTimes(null);
        })
        .finally(() => setLoading(false));
      return;
    }

    setManualHint("Enter the next sunrise time to finish manual mode.");
    setSunTimes(null);
  }, [mode, sunrise, sunset, nextSunrise, tz, dateISO, lat, lon]);

  useEffect(() => {
    if (hasTzParam) return;
    if (lat != null && lon != null) return;
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (localTz && localTz !== tz) {
      setTz(localTz);
    }
  }, [hasTzParam, tz, lat, lon]);

  useEffect(() => {
    if (hasDateParam || isDateAutoSet) return;
    const localDate = getLocalDateISO(tz);
    if (localDate !== dateISO) {
      setDateISO(localDate);
    }
    setIsDateAutoSet(true);
  }, [hasDateParam, tz, dateISO, isDateAutoSet]);

  const combinedSegments = useMemo(() => {
    if (!sunTimes) return [];
    const weekday = getWeekdayForDate(sunTimes.sunrise, tz);
    const { daySegments, nightSegments } = computeSegments({
      sunrise: sunTimes.sunrise,
      sunset: sunTimes.sunset,
      nextSunrise: sunTimes.nextSunrise,
      weekday
    });
    return [...daySegments, ...nightSegments];
  }, [sunTimes, tz]);

  const isToday = dateISO === getLocalDateISO(tz);

  const daySegments = combinedSegments.filter((segment) => segment.isDay);
  const nightSegments = combinedSegments.filter((segment) => !segment.isDay);

  const baseDateKey = sunTimes ? getDateKey(sunTimes.sunrise, tz) : dateISO;
  const plannerSegments: PlannerSegment[] = useMemo(
    () =>
      combinedSegments.map((segment) => ({
        ...segment,
        dateISO: baseDateKey
      })),
    [combinedSegments, baseDateKey]
  );

  function handleCityChange(value: string) {
    setCityInput(value);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const match = cities.find((city) => city.name.toLowerCase() === cityInput.toLowerCase());
      if (match) {
        setLat(match.lat);
        setLon(match.lon);
        setTz(match.tz);
        setPathBase(`/choghadiya/${match.slug}`);
        track("choghadiya_city_selected");
      } else if (cityInput.trim().length === 0) {
        setLat(null);
        setLon(null);
        setPathBase("/choghadiya");
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [cityInput]);

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setCityInput("");
      setLat(pos.coords.latitude);
      setLon(pos.coords.longitude);
      const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (deviceTz) setTz(deviceTz);
      setPathBase("/choghadiya");
      track("choghadiya_use_my_location_clicked");
    });
  }

  function handleDateChange(nextDate: string) {
    setDateISO(nextDate);
    track("choghadiya_date_changed");
  }

  function handleTimezoneChange(value: string) {
    setTz(value);
  }

  function handleModeToggle(value: "auto" | "manual") {
    setMode(value);
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    track("choghadiya_share_clicked");
  }

  function track(event: string) {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", event);
    }
  }

  function downloadICS(segment: ChoghadiyaSegment) {
    const start = segment.start;
    const end = segment.end;
    const fmt = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bhakti Sagar//Choghadiya//EN
BEGIN:VEVENT
UID:${segment.name}-${segment.start.getTime()}
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(start)}
DTEND:${fmt(end)}
SUMMARY:${segment.name} Choghadiya
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${segment.name}-choghadiya.ics`;
    link.click();
    URL.revokeObjectURL(url);
    track("choghadiya_add_reminder_clicked");
  }

  function handlePlannerReminder(segment: PlannerSegment) {
    downloadICS(segment);
    track("choghadiya_planner_reminder_clicked");
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
  }

  useEffect(() => {
    if (!sunTimes) return;
    setSelectedTimeMs(null);
  }, [sunTimes]);

  useEffect(() => {
    if (!pathname?.startsWith("/choghadiya")) return;
    const timeout = window.setTimeout(() => {
      const query = new URLSearchParams();
      if (cityInput) query.set("city", cityInput);
      if (dateISO) query.set("date", dateISO);
      if (tz) query.set("tz", tz);
      if (lat != null) query.set("lat", String(lat));
      if (lon != null) query.set("lon", String(lon));
      if (activePane) query.set("pane", activePane);
      if (plannerParams.goal) query.set("goal", plannerParams.goal);
      if (plannerParams.window) query.set("window", plannerParams.window);
      if (plannerParams.start) query.set("start", plannerParams.start);
      if (plannerParams.end) query.set("end", plannerParams.end);
      if (mode === "manual") {
        query.set("mode", "manual");
        if (sunrise) query.set("sunrise", sunrise);
        if (sunset) query.set("sunset", sunset);
        if (nextSunrise) query.set("nextSunrise", nextSunrise);
      }
      const qs = query.toString();
      const path = pathBase || "/choghadiya";
      const nextUrl = qs ? `${path}?${qs}` : path;
      if (typeof window !== "undefined") {
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        if (currentUrl === nextUrl) return;
      }
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", nextUrl);
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [
    pathname,
    cityInput,
    dateISO,
    tz,
    lat,
    lon,
    activePane,
    plannerParams.goal,
    plannerParams.window,
    plannerParams.start,
    plannerParams.end,
    mode,
    sunrise,
    sunset,
    nextSunrise,
    pathBase
  ]);

  const containerClass = plannerOpen ? "space-y-4 md:pr-[420px]" : "space-y-4";

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(`${dateISO}T00:00:00Z`));

  return (
    <div className={containerClass}>
      <h1 className="sr-only">Aaj Ka Choghadiya</h1>
      <DateController
        cityInput={cityInput}
        onCityChange={handleCityChange}
        cities={cities}
        onUseLocation={handleUseMyLocation}
        timeZones={timeZones}
        tz={tz}
        onTimezoneChange={handleTimezoneChange}
        dateISO={dateISO}
        onDateChange={handleDateChange}
        onPrevDay={() => handleDateChange(addDaysISO(dateISO, -1))}
        onNextDay={() => handleDateChange(addDaysISO(dateISO, 1))}
        onToday={() => handleDateChange(getLocalDateISO(tz))}
        onShare={handleShare}
      />

      {error && <p className="text-sm text-sagar-crimson">{error}</p>}

      <CurrentSlotCard
        segments={combinedSegments}
        timeZone={tz}
        baseDateKey={baseDateKey}
        sunrise={sunTimes?.sunrise ?? null}
        sunset={sunTimes?.sunset ?? null}
        loading={loading}
        isToday={isToday}
        dateLabel={dateLabel}
        hasTimes={Boolean(sunTimes)}
      />

      {sunTimes && combinedSegments.length > 0 && (
        <TimelineBar
          segments={combinedSegments}
          sunTimes={sunTimes}
          timeZone={tz}
          baseDateKey={baseDateKey}
          selectedTimeMs={selectedTimeMs}
          onSelectTime={setSelectedTimeMs}
        />
      )}

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">
        <a href="#day" className="text-sagar-saffron">
          Jump to Day
        </a>
        <a href="#night" className="text-sagar-saffron">
          Jump to Night
        </a>
      </div>

      <TimetablePane
        dateLabel={dateLabel}
        sunrise={sunTimes?.sunrise ?? null}
        sunset={sunTimes?.sunset ?? null}
        nextSunrise={sunTimes?.nextSunrise ?? null}
        daySegments={daySegments}
        nightSegments={nightSegments}
        isToday={isToday}
        selectedTimeMs={selectedTimeMs}
        timeZone={tz}
        baseDateKey={baseDateKey}
        onAddReminder={downloadICS}
        onCopyTime={handleCopy}
        activePane={activePane}
        onPaneChange={setActivePane}
      />

      <Legend />

      <details className="rounded-2xl border border-sagar-amber/20 bg-white px-4 py-2 text-xs text-sagar-ink/70">
        <summary className="cursor-pointer font-semibold uppercase tracking-[0.2em] text-sagar-rose">
          Settings
        </summary>
        <div className="mt-2 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">
          <button onClick={() => handleModeToggle("auto")} className={mode === "auto" ? "text-sagar-saffron" : ""}>
            Auto
          </button>
          <button onClick={() => handleModeToggle("manual")} className={mode === "manual" ? "text-sagar-saffron" : ""}>
            Manual
          </button>
        </div>
        {mode === "manual" && (
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input
              value={sunrise}
              onChange={(e) => setSunrise(e.target.value)}
              placeholder="Sunrise (HH:mm)"
              className="rounded-full border border-sagar-amber/30 bg-white px-3 py-2 text-xs"
            />
            <input
              value={sunset}
              onChange={(e) => setSunset(e.target.value)}
              placeholder="Sunset (HH:mm)"
              className="rounded-full border border-sagar-amber/30 bg-white px-3 py-2 text-xs"
            />
            <input
              value={nextSunrise}
              onChange={(e) => setNextSunrise(e.target.value)}
              placeholder="Next sunrise (HH:mm)"
              className="rounded-full border border-sagar-amber/30 bg-white px-3 py-2 text-xs"
            />
          </div>
        )}
        {manualHint && <p className="mt-2 text-xs text-sagar-ink/60">{manualHint}</p>}
      </details>

      <GoalPlannerPanel
        open={plannerOpen}
        onClose={() => {
          setPlannerOpen(false);
          setPlannerParams({});
        }}
        mode={mode}
        tz={tz}
        dateISO={dateISO}
        lat={lat}
        lon={lon}
        cityLabel={cityInput || "your location"}
        sunTimes={sunTimes}
        segments={plannerSegments}
        plannerParams={plannerParams}
        onPlannerParamsChange={handlePlannerParamsChange}
        onAddReminder={handlePlannerReminder}
        onApplySegment={(segment) => setSelectedTimeMs(segment.start.getTime())}
        formatTime={(segment) =>
          `${formatTimeWithDay(segment.start, tz, segment.dateISO)} – ${formatTimeWithDay(segment.end, tz, segment.dateISO)}`
        }
      />

      {!plannerOpen && (
        <>
          <button
            onClick={() => {
              setPlannerOpen(true);
              track("choghadiya_planner_opened");
            }}
            className="fixed right-2 top-1/2 z-40 hidden -translate-y-1/2 rounded-full bg-sagar-saffron px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-white md:flex"
          >
            AI Planner
          </button>
          <button
            onClick={() => {
              setPlannerOpen(true);
              track("choghadiya_planner_opened");
            }}
            className="fixed right-2 bottom-24 z-40 rounded-full bg-sagar-saffron px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-white md:hidden"
          >
            AI Planner
          </button>
        </>
      )}

    </div>
  );
}
  const handlePlannerParamsChange = useCallback((params: PlannerParams) => {
    setPlannerParams(params);
  }, []);
