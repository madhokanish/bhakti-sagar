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
import { PlannerSegment } from "@/lib/choghadiyaPlanner";

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
    const match = cities.find((city) => city.name.toLowerCase() === value.toLowerCase());
    if (match) {
      setLat(match.lat);
      setLon(match.lon);
      setTz(match.tz);
      setPathBase(`/choghadiya/${match.slug}`);
      track("choghadiya_city_selected");
    } else {
      setLat(null);
      setLon(null);
      setPathBase("/choghadiya");
    }
  }

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-serif text-sagar-ink">Aaj Ka Choghadiya</h1>
        <button
          onClick={handleShare}
          className="rounded-full border border-sagar-amber/30 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70"
          aria-label="Share this choghadiya"
        >
          Share
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-sagar-amber/20 bg-white p-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
            Location
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              list="city-list"
              value={cityInput}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder="City (type to search)"
              aria-label="City"
              className="w-full rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-sm outline-none md:w-auto"
            />
            <datalist id="city-list">
              {cities.map((city) => (
                <option key={city.slug} value={city.name} />
              ))}
            </datalist>
            <button
              onClick={handleUseMyLocation}
              className="rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70"
            >
              Use my location
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
            Timezone
          </label>
          <input
            list="tz-list"
            value={tz}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            aria-label="Timezone"
            className="w-full rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-sm outline-none"
          />
          <datalist id="tz-list">
            {timeZones.map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-sagar-amber/20 bg-white p-4 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleDateChange(getLocalDateISO(tz))}
            className="rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70"
          >
            Today
          </button>
          <button
            onClick={() => handleDateChange(new Date(new Date(dateISO).getTime() - 86400000).toISOString().slice(0, 10))}
            className="rounded-full border border-sagar-amber/30 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70"
          >
            Prev
          </button>
          <button
            onClick={() => handleDateChange(new Date(new Date(dateISO).getTime() + 86400000).toISOString().slice(0, 10))}
            className="rounded-full border border-sagar-amber/30 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70"
          >
            Next
          </button>
          <input
            type="date"
            value={dateISO}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">
          <button onClick={() => handleModeToggle("auto")} className={mode === "auto" ? "text-sagar-saffron" : ""}>
            Auto
          </button>
          <button onClick={() => handleModeToggle("manual")} className={mode === "manual" ? "text-sagar-saffron" : ""}>
            Manual
          </button>
        </div>
      </div>

      {mode === "manual" && (
        <div className="space-y-2">
          <div className="grid gap-3 rounded-2xl border border-sagar-amber/20 bg-white p-4 md:grid-cols-3">
            <input
              value={sunrise}
              onChange={(e) => setSunrise(e.target.value)}
              placeholder="Sunrise (HH:mm)"
              className="rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-sm"
            />
            <input
              value={sunset}
              onChange={(e) => setSunset(e.target.value)}
              placeholder="Sunset (HH:mm)"
              className="rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-sm"
            />
            <input
              value={nextSunrise}
              onChange={(e) => setNextSunrise(e.target.value)}
              placeholder="Next sunrise (HH:mm)"
              className="rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-sm"
            />
          </div>
          {manualHint && <p className="text-sm text-sagar-ink/60">{manualHint}</p>}
        </div>
      )}

      <div className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Current Choghadiya</p>
        {error && <p className="mt-3 text-sm text-sagar-crimson">{error}</p>}
        {loading && (
          <div className="mt-3 space-y-2 animate-pulse">
            <div className="h-5 w-32 rounded-full bg-sagar-cream/80" />
            <div className="h-4 w-48 rounded-full bg-sagar-cream/60" />
            <div className="h-4 w-28 rounded-full bg-sagar-cream/60" />
          </div>
        )}
        {!loading && !error && currentSegment && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif text-sagar-ink">{currentSegment.name}</span>
              <span className="rounded-full bg-sagar-amber/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70">
                {currentSegment.label}
              </span>
            </div>
            <p className="text-sm text-sagar-ink/70">
              {formatTimeWithDay(currentSegment.start, tz, baseDateKey)} – {formatTimeWithDay(currentSegment.end, tz, baseDateKey)}
            </p>
            {countdown && (
              <p className="text-sm text-sagar-ink/60">
                Ends in {countdown}
              </p>
            )}
          </div>
        )}
        {!loading && !error && !currentSegment && (
          <p className="mt-3 text-sm text-sagar-ink/60">Select a city or add sunrise/sunset times to begin.</p>
        )}
        {nextGood && (
          <button
            onClick={() => setSelectedTimeMs(nextGood.start.getTime())}
            className="mt-3 rounded-full border border-sagar-amber/30 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70"
          >
            Next good slot: {nextGood.name} • {formatTimeWithDay(nextGood.start, tz, baseDateKey)}
          </button>
        )}
      </div>

      <GoalPlannerLauncher onOpen={() => {
        setPlannerOpen(true);
        track("choghadiya_planner_opened");
      }} />
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

      {loading && !sunTimes && (
        <div className="rounded-2xl border border-sagar-amber/20 bg-white p-4 animate-pulse">
          <div className="h-4 w-24 rounded-full bg-sagar-cream/70" />
          <div className="mt-4 h-6 w-full rounded-full bg-sagar-cream/60" />
          <div className="mt-3 h-4 w-40 rounded-full bg-sagar-cream/60" />
        </div>
      )}

      {sunTimes && (
        <div className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <h2 className="text-lg font-serif text-sagar-ink">Day Choghadiya</h2>
          <div className="mt-3 space-y-3">
            {daySegments.map((segment) => (
              <div key={segment.start.toISOString()} className="flex items-center justify-between text-sm text-sagar-ink/70">
                <div>
                  <span className="font-semibold text-sagar-ink">{segment.name}</span>{" "}
                  <span className="ml-2 rounded-full bg-sagar-amber/20 px-2 py-0.5 text-xs uppercase text-sagar-ink/70">
                    {segment.label}
                  </span>
                </div>
                <div className="text-right">
                  <p>
                    {formatTimeWithDay(segment.start, tz, baseDateKey)} – {formatTimeWithDay(segment.end, tz, baseDateKey)}
                  </p>
                  <button onClick={() => downloadICS(segment)} className="text-xs text-sagar-saffron">
                    Add reminder
                  </button>
                </div>
              </div>
            ))}
            {!sunTimes && !loading && (
              <p className="text-sm text-sagar-ink/60">Select a city to see the day choghadiya.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <h2 className="text-lg font-serif text-sagar-ink">Night Choghadiya</h2>
          <div className="mt-3 space-y-3">
            {nightSegments.map((segment) => (
              <div key={segment.start.toISOString()} className="flex items-center justify-between text-sm text-sagar-ink/70">
                <div>
                  <span className="font-semibold text-sagar-ink">{segment.name}</span>{" "}
                  <span className="ml-2 rounded-full bg-sagar-amber/20 px-2 py-0.5 text-xs uppercase text-sagar-ink/70">
                    {segment.label}
                  </span>
                </div>
                <div className="text-right">
                  <p>
                    {formatTimeWithDay(segment.start, tz, baseDateKey)} – {formatTimeWithDay(segment.end, tz, baseDateKey)}
                  </p>
                  <button onClick={() => downloadICS(segment)} className="text-xs text-sagar-saffron">
                    Add reminder
                  </button>
                </div>
              </div>
            ))}
            {!sunTimes && !loading && (
              <p className="text-sm text-sagar-ink/60">Night choghadiya will appear once times are available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
