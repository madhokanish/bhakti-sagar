"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChoghadiyaSegment,
  computeSegments,
  formatCountdown,
  formatTimeInput,
  formatTimeWithDay,
  getCurrentSegment,
  getDateKey,
  getLocalDateISO,
  getNextGoodSegment,
  getWeekdayForDate,
  toUTCDateFromLocal
} from "@/lib/choghadiya";
import { cities, CityOption } from "@/lib/choghadiyaCities";
import GoalPlannerLauncher from "@/components/choghadiya/GoalPlannerLauncher";
import GoalPlannerPanel, { type PlannerParams } from "@/components/choghadiya/GoalPlannerPanel";
import StickyControlBar from "@/components/choghadiya/StickyControlBar";
import SwipeDateStrip from "@/components/choghadiya/SwipeDateStrip";
import CurrentSlotCard from "@/components/choghadiya/CurrentSlotCard";
import TimetableSection from "@/components/choghadiya/TimetableSection";
import Legend from "@/components/choghadiya/Legend";
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
};

const goodLabels = new Set(["Best", "Good", "Gain", "Neutral"]);

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
  initialPlannerEnd
}: Props) {
  const router = useRouter();
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
  const [nowMs, setNowMs] = useState(Date.now());
  const [timeZones, setTimeZones] = useState<string[]>([]);
  const [pathBase, setPathBase] = useState(initialPathBase);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const scrubbingRef = useRef(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerParams, setPlannerParams] = useState<PlannerParams>({
    goal: initialPlannerGoal,
    window: initialPlannerWindow,
    start: initialPlannerStart,
    end: initialPlannerEnd
  });

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
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
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
    if (hasDateParam) return;
    const localDate = getLocalDateISO(tz);
    if (localDate !== dateISO) {
      setDateISO(localDate);
    }
  }, [hasDateParam, tz, dateISO]);

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

  const currentSegment = useMemo(() => {
    if (!sunTimes) return null;
    return getCurrentSegment(combinedSegments, new Date(nowMs));
  }, [combinedSegments, nowMs, sunTimes]);

  const nextGood = useMemo(() => {
    if (!sunTimes) return null;
    return getNextGoodSegment(combinedSegments, new Date(nowMs));
  }, [combinedSegments, nowMs, sunTimes]);

  const selectedSegment = useMemo(() => {
    if (!sunTimes) return null;
    if (selectedTimeMs == null) return currentSegment;
    return combinedSegments.find(
      (segment) => selectedTimeMs >= segment.start.getTime() && selectedTimeMs < segment.end.getTime()
    );
  }, [combinedSegments, selectedTimeMs, currentSegment, sunTimes]);

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

  const timelineTotal = sunTimes
    ? sunTimes.nextSunrise.getTime() - sunTimes.sunrise.getTime()
    : 0;
  const nowPosition = sunTimes
    ? ((nowMs - sunTimes.sunrise.getTime()) / timelineTotal) * 100
    : 0;
  const selectedRatio = sunTimes
    ? ((selectedTimeMs ?? nowMs) - sunTimes.sunrise.getTime()) / timelineTotal
    : 0;
  const countdown = currentSegment
    ? formatCountdown(currentSegment.end.getTime() - nowMs)
    : null;

  useEffect(() => {
    if (!sunTimes) return;
    setSelectedTimeMs(null);
  }, [sunTimes]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const query = new URLSearchParams();
      if (cityInput) query.set("city", cityInput);
      if (dateISO) query.set("date", dateISO);
      if (tz) query.set("tz", tz);
      if (lat != null) query.set("lat", String(lat));
      if (lon != null) query.set("lon", String(lon));
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
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [
    cityInput,
    dateISO,
    tz,
    lat,
    lon,
    plannerParams.goal,
    plannerParams.window,
    plannerParams.start,
    plannerParams.end,
    mode,
    sunrise,
    sunset,
    nextSunrise,
    pathBase,
    router
  ]);

  function updateSelectedFromPointer(clientX: number) {
    if (!sunTimes || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const time = sunTimes.sunrise.getTime() + ratio * timelineTotal;
    setSelectedTimeMs(time);
  }

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Aaj Ka Choghadiya</h1>
      <StickyControlBar
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

      <SwipeDateStrip dateISO={dateISO} tz={tz} onDateChange={handleDateChange} />

      {error && <p className="text-sm text-sagar-crimson">{error}</p>}

      <CurrentSlotCard
        currentSegment={currentSegment}
        nextGood={nextGood}
        countdown={countdown}
        timeZone={tz}
        baseDateKey={baseDateKey}
        sunrise={sunTimes?.sunrise ?? null}
        sunset={sunTimes?.sunset ?? null}
        loading={loading}
      />

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">
        <a href="#day" className="text-sagar-saffron">
          Jump to Day
        </a>
        <a href="#night" className="text-sagar-saffron">
          Jump to Night
        </a>
      </div>

      <TimetableSection
        id="day"
        title="Day"
        anchorLabel="Sunrise"
        headerTime={sunTimes?.sunrise ?? null}
        segments={daySegments}
        currentSegment={currentSegment}
        timeZone={tz}
        baseDateKey={baseDateKey}
        onAddReminder={downloadICS}
        onCopyTime={handleCopy}
      />
      <TimetableSection
        id="night"
        title="Night"
        anchorLabel="Sunset"
        headerTime={sunTimes?.sunset ?? null}
        segments={nightSegments}
        currentSegment={currentSegment}
        timeZone={tz}
        baseDateKey={baseDateKey}
        onAddReminder={downloadICS}
        onCopyTime={handleCopy}
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

      <GoalPlannerLauncher
        onOpen={() => {
          setPlannerOpen(true);
          track("choghadiya_planner_opened");
        }}
      />

      <GoalPlannerPanel
        open={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        mode={mode}
        tz={tz}
        dateISO={dateISO}
        lat={lat}
        lon={lon}
        cityLabel={cityInput || "your location"}
        sunTimes={sunTimes}
        segments={plannerSegments}
        plannerParams={plannerParams}
        onPlannerParamsChange={(params) => setPlannerParams(params)}
        onAddReminder={handlePlannerReminder}
        formatTime={(segment) =>
          `${formatTimeWithDay(segment.start, tz, segment.dateISO)} – ${formatTimeWithDay(segment.end, tz, segment.dateISO)}`
        }
      />

      {sunTimes && (
        <div className="hidden md:block rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Timeline</p>
          <div
            ref={timelineRef}
            className="relative mt-4 h-6 rounded-full bg-sagar-cream/70"
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.max(0, Math.min(1, selectedRatio)) * 100)}
            onPointerDown={(event) => {
              scrubbingRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSelectedFromPointer(event.clientX);
            }}
            onPointerMove={(event) => {
              if (!scrubbingRef.current) return;
              updateSelectedFromPointer(event.clientX);
            }}
            onPointerUp={(event) => {
              scrubbingRef.current = false;
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => {
              scrubbingRef.current = false;
            }}
            onKeyDown={(event) => {
              if (!sunTimes) return;
              const step = timelineTotal / 24;
              const minTime = sunTimes.sunrise.getTime();
              const maxTime = sunTimes.nextSunrise.getTime() - 1;
              if (event.key === "ArrowRight") {
                const next = Math.min(maxTime, (selectedTimeMs ?? nowMs) + step);
                setSelectedTimeMs(next);
              }
              if (event.key === "ArrowLeft") {
                const next = Math.max(minTime, (selectedTimeMs ?? nowMs) - step);
                setSelectedTimeMs(next);
              }
            }}
          >
            <div className="absolute inset-0 flex overflow-hidden rounded-full">
              {combinedSegments.map((segment) => {
                const width =
                  ((segment.end.getTime() - segment.start.getTime()) / timelineTotal) * 100;
                return (
                  <button
                    key={`${segment.name}-${segment.start.getTime()}`}
                    className={`h-full ${goodLabels.has(segment.label) ? "bg-sagar-amber/50" : "bg-sagar-rose/30"}`}
                    style={{ width: `${width}%` }}
                    onClick={() => setSelectedTimeMs(segment.start.getTime())}
                    aria-label={`${segment.name} ${segment.label}`}
                  />
                );
              })}
            </div>
            <div
              className="absolute top-0 h-full w-0.5 bg-sagar-saffron"
              style={{ left: `${Math.max(0, Math.min(100, nowPosition))}%` }}
            />
          </div>
          {selectedSegment && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sagar-ink/70">
              <span className="font-semibold text-sagar-ink">{selectedSegment.name}</span>
              <span className="rounded-full bg-sagar-amber/20 px-2 py-0.5 text-xs uppercase text-sagar-ink/70">
                {selectedSegment.label}
              </span>
              <span>
                {formatTimeWithDay(selectedSegment.start, tz, baseDateKey)} –{" "}
                {formatTimeWithDay(selectedSegment.end, tz, baseDateKey)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
