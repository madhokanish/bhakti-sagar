import {
  ChoghadiyaName,
  ChoghadiyaSegment,
  computeSegments,
  getWeekdayForDate
} from "@/lib/choghadiya";

export type GoalKey =
  | "travel"
  | "puja"
  | "start_work"
  | "start_business"
  | "buy_vehicle"
  | "study"
  | "ceremony"
  | "marriage"
  | "other";

export type WindowKey = "3h" | "6h" | "day" | "night" | "week" | "month" | "custom";

export type PlannerSegment = ChoghadiyaSegment & { dateISO: string };

export type PlannerResult = {
  segment: PlannerSegment;
  score: number;
  why: string;
};

export const goalOptions: { key: GoalKey; label: string }[] = [
  { key: "travel", label: "Travel" },
  { key: "puja", label: "Puja" },
  { key: "start_work", label: "Start work or task" },
  { key: "start_business", label: "Start business" },
  { key: "buy_vehicle", label: "Buy vehicle" },
  { key: "study", label: "Study or learning" },
  { key: "ceremony", label: "Ceremony" },
  { key: "marriage", label: "Marriage" },
  { key: "other", label: "Other" }
];

export const windowOptions: { key: WindowKey; label: string; requiresAuto?: boolean }[] = [
  { key: "3h", label: "Next 3 hours" },
  { key: "6h", label: "Next 6 hours" },
  { key: "day", label: "Today (daytime)" },
  { key: "night", label: "Tonight" },
  { key: "week", label: "This week", requiresAuto: true },
  { key: "month", label: "This month", requiresAuto: true },
  { key: "custom", label: "Custom range", requiresAuto: true }
];

const preferenceMap: Record<GoalKey, ChoghadiyaName[]> = {
  travel: ["Char", "Amrit", "Shubh", "Labh"],
  puja: ["Shubh", "Amrit", "Labh", "Char"],
  start_work: ["Amrit", "Labh", "Shubh", "Char"],
  start_business: ["Labh", "Amrit", "Shubh", "Char"],
  buy_vehicle: ["Amrit", "Labh", "Shubh", "Char"],
  study: ["Labh", "Shubh", "Amrit", "Char"],
  ceremony: ["Shubh", "Amrit", "Labh", "Char"],
  marriage: ["Shubh", "Amrit", "Labh", "Char"],
  other: ["Amrit", "Shubh", "Labh", "Char"]
};

const goodSet = new Set<ChoghadiyaName>(["Amrit", "Shubh", "Labh", "Char"]);
const avoidSet = new Set<ChoghadiyaName>(["Rog", "Kaal", "Udveg"]);

const whyMap: Record<ChoghadiyaName, string> = {
  Amrit: "A generally good slot for most new starts.",
  Labh: "Traditionally linked with gain and progress.",
  Shubh: "Traditionally linked with auspicious and devotional work.",
  Char: "Traditionally preferred for travel and movement.",
  Rog: "Usually avoided for auspicious starts.",
  Kaal: "Usually avoided for auspicious starts.",
  Udveg: "Usually avoided for auspicious starts."
};

export function getGoalPreference(goal: GoalKey) {
  return preferenceMap[goal];
}

export function isGood(name: ChoghadiyaName) {
  return goodSet.has(name);
}

export function isAvoid(name: ChoghadiyaName) {
  return avoidSet.has(name);
}

export function getWhyLine(name: ChoghadiyaName) {
  return whyMap[name];
}

export function filterSegmentsByWindow(
  segments: PlannerSegment[],
  windowStartMs: number,
  windowEndMs: number
) {
  return segments.filter(
    (segment) => segment.start.getTime() < windowEndMs && segment.end.getTime() > windowStartMs
  );
}

export function scoreSegment({
  segment,
  goal,
  windowStartMs,
  includeAvoid
}: {
  segment: PlannerSegment;
  goal: GoalKey;
  windowStartMs: number;
  includeAvoid: boolean;
}) {
  const isGoodSlot = isGood(segment.name);
  if (!includeAvoid && !isGoodSlot) return null;
  let score = isGoodSlot ? 100 : 0;
  const prefs = getGoalPreference(goal);
  const index = prefs.indexOf(segment.name);
  if (index >= 0) {
    score += [40, 25, 15, 10][index] ?? 0;
  }
  const hoursFromStart = Math.max(0, (segment.start.getTime() - windowStartMs) / 3600000);
  const soonerBonus = Math.max(0, 10 - Math.floor(hoursFromStart));
  score += soonerBonus;
  return score;
}

export function rankSegments({
  segments,
  goal,
  windowStartMs,
  includeAvoid,
  limit = 3
}: {
  segments: PlannerSegment[];
  goal: GoalKey;
  windowStartMs: number;
  includeAvoid: boolean;
  limit?: number;
}) {
  const scored: PlannerResult[] = [];
  segments.forEach((segment) => {
    const score = scoreSegment({ segment, goal, windowStartMs, includeAvoid });
    if (score == null) return;
    scored.push({ segment, score, why: getWhyLine(segment.name) });
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.segment.start.getTime() - b.segment.start.getTime();
  });
  return scored.slice(0, limit);
}

export function computeSegmentsForDate({
  dateISO,
  sunTimes,
  timeZone
}: {
  dateISO: string;
  sunTimes: { sunrise: Date; sunset: Date; nextSunrise: Date };
  timeZone: string;
}) {
  const weekday = getWeekdayForDate(sunTimes.sunrise, timeZone);
  const { daySegments, nightSegments } = computeSegments({
    sunrise: sunTimes.sunrise,
    sunset: sunTimes.sunset,
    nextSunrise: sunTimes.nextSunrise,
    weekday
  });

  const attach = (segment: ChoghadiyaSegment): PlannerSegment => ({
    ...segment,
    dateISO
  });

  return {
    daySegments: daySegments.map(attach),
    nightSegments: nightSegments.map(attach),
    segments: [...daySegments.map(attach), ...nightSegments.map(attach)]
  };
}

export function addDaysISO(dateISO: string, days: number) {
  const [year, month, day] = dateISO.split("-").map((value) => parseInt(value, 10));
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getDateRangeISOs(startISO: string, endISO: string) {
  const dates: string[] = [];
  let cursor = startISO;
  while (cursor <= endISO) {
    dates.push(cursor);
    cursor = addDaysISO(cursor, 1);
  }
  return dates;
}

export function getEndOfIsoWeekDate(dateISO: string) {
  const [year, month, day] = dateISO.split("-").map((value) => parseInt(value, 10));
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0));
  const dayOfWeek = date.getUTCDay();
  const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
  const diff = 7 - isoDay;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

export function getEndOfMonthDate(dateISO: string) {
  const [year, month] = dateISO.split("-").map((value) => parseInt(value, 10));
  const date = new Date(Date.UTC(year, month, 0, 12, 0));
  return date.toISOString().slice(0, 10);
}

export function parseDateTimeLocal(value?: string) {
  if (!value) return null;
  const [dateISO, time] = value.split("T");
  if (!dateISO || !time) return null;
  return { dateISO, time };
}

type SunTimesMs = {
  sunrise: number;
  sunset: number;
  nextSunrise: number;
};

const sunCache = new Map<string, { data: SunTimesMs; expiresAt: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30;

export async function fetchSunTimesCached({
  dateISO,
  lat,
  lon,
  tz,
  signal
}: {
  dateISO: string;
  lat: number;
  lon: number;
  tz: string;
  signal?: AbortSignal;
}) {
  const key = `${lat}:${lon}:${dateISO}:${tz}`;
  const cached = sunCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  const res = await fetch(
    `/api/choghadiya/sun?lat=${lat}&lon=${lon}&date=${dateISO}&tz=${encodeURIComponent(tz)}`,
    { signal }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Unable to fetch sunrise/sunset.");
  }
  const payload = {
    sunrise: new Date(data.sunrise).getTime(),
    sunset: new Date(data.sunset).getTime(),
    nextSunrise: new Date(data.nextSunrise).getTime()
  };
  sunCache.set(key, { data: payload, expiresAt: Date.now() + CACHE_TTL });
  return payload;
}

export async function computeSegmentsForRange({
  startISO,
  endISO,
  lat,
  lon,
  tz,
  signal,
  timeBudgetMs = 5000
}: {
  startISO: string;
  endISO: string;
  lat: number;
  lon: number;
  tz: string;
  signal?: AbortSignal;
  timeBudgetMs?: number;
}) {
  const dates = getDateRangeISOs(startISO, endISO);
  const segments: PlannerSegment[] = [];
  const startTime = Date.now();
  let timedOut = false;

  for (const dateISO of dates) {
    if (signal?.aborted) break;
    if (Date.now() - startTime > timeBudgetMs) {
      timedOut = true;
      break;
    }
    const sun = await fetchSunTimesCached({ dateISO, lat, lon, tz, signal });
    const computed = computeSegmentsForDate({
      dateISO,
      sunTimes: {
        sunrise: new Date(sun.sunrise),
        sunset: new Date(sun.sunset),
        nextSunrise: new Date(sun.nextSunrise)
      },
      timeZone: tz
    });
    segments.push(...computed.segments);
  }

  return { segments, timedOut };
}
