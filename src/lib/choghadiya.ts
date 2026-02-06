export type ChoghadiyaName = "Udveg" | "Amrit" | "Rog" | "Labh" | "Shubh" | "Char" | "Kaal";

export type ChoghadiyaLabel = "Best" | "Good" | "Gain" | "Neutral" | "Evil" | "Loss" | "Bad";

export type ChoghadiyaSegment = {
  name: ChoghadiyaName;
  label: ChoghadiyaLabel;
  start: Date;
  end: Date;
  isDay: boolean;
  index: number;
};

const dayTable: Record<number, ChoghadiyaName[]> = {
  0: ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"],
  1: ["Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit"],
  2: ["Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"],
  3: ["Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh"],
  4: ["Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh"],
  5: ["Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char"],
  6: ["Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal"]
};

const nightTable: Record<number, ChoghadiyaName[]> = {
  0: ["Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh"],
  1: ["Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char"],
  2: ["Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal"],
  3: ["Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg"],
  4: ["Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit"],
  5: ["Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog"],
  6: ["Labh", "Udveg", "Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh"]
};

const labelMap: Record<ChoghadiyaName, ChoghadiyaLabel> = {
  Amrit: "Best",
  Shubh: "Good",
  Labh: "Gain",
  Char: "Neutral",
  Rog: "Evil",
  Kaal: "Loss",
  Udveg: "Bad"
};

const goodSet = new Set<ChoghadiyaName>(["Amrit", "Shubh", "Labh", "Char"]);

export function getLabel(name: ChoghadiyaName) {
  return labelMap[name];
}

export function computeSegments({
  sunrise,
  sunset,
  nextSunrise,
  weekday
}: {
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  weekday: number;
}) {
  const dayDuration = sunset.getTime() - sunrise.getTime();
  const nightDuration = nextSunrise.getTime() - sunset.getTime();
  const daySlice = dayDuration / 8;
  const nightSlice = nightDuration / 8;
  const dayNames = dayTable[weekday];
  const nightNames = nightTable[weekday];

  const daySegments: ChoghadiyaSegment[] = dayNames.map((name, index) => {
    const start = new Date(sunrise.getTime() + daySlice * index);
    const end = index === 7 ? sunset : new Date(sunrise.getTime() + daySlice * (index + 1));
    return { name, label: getLabel(name), start, end, isDay: true, index };
  });

  const nightSegments: ChoghadiyaSegment[] = nightNames.map((name, index) => {
    const start = new Date(sunset.getTime() + nightSlice * index);
    const end = index === 7 ? nextSunrise : new Date(sunset.getTime() + nightSlice * (index + 1));
    return { name, label: getLabel(name), start, end, isDay: false, index };
  });

  return { daySegments, nightSegments };
}

export function getCurrentSegment(segments: ChoghadiyaSegment[], now: Date) {
  const nowMs = now.getTime();
  return segments.find((segment) => nowMs >= segment.start.getTime() && nowMs < segment.end.getTime()) ?? null;
}

export function getNextGoodSegment(segments: ChoghadiyaSegment[], now: Date) {
  const nowMs = now.getTime();
  return segments.find((segment) => segment.start.getTime() > nowMs && goodSet.has(segment.name)) ?? null;
}

function roundToMinute(date: Date) {
  const ms = Math.round(date.getTime() / 60000) * 60000;
  return new Date(ms);
}

export function formatTime(date: Date, timeZone: string, withDate = false, round = true) {
  const value = round ? roundToMinute(date) : date;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(withDate ? { month: "short", day: "2-digit" } : {})
  });
  return formatter.format(value);
}

export function getDateKey(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

export function formatTimeWithDay(date: Date, timeZone: string, baseDateKey: string) {
  const key = getDateKey(date, timeZone);
  return formatTime(date, timeZone, key !== baseDateKey);
}

export function formatTimeInput(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return formatter.format(date);
}

export function formatCountdown(msRemaining: number) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function getWeekdayForDate(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" });
  const day = formatter.format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}

export function getLocalDateISO(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

export function parseTimeString(time: string) {
  const [hour, minute] = time.split(":").map((value) => parseInt(value, 10));
  return { hour, minute };
}

export function toUTCDateFromLocal({
  dateISO,
  time,
  timeZone
}: {
  dateISO: string;
  time: string;
  timeZone: string;
}) {
  const [year, month, day] = dateISO.split("-").map((value) => parseInt(value, 10));
  const { hour, minute } = parseTimeString(time);
  let utc = Date.UTC(year, month - 1, day, hour, minute);

  for (let i = 0; i < 3; i += 1) {
    const offset = getTimeZoneOffset(new Date(utc), timeZone);
    const nextUtc = Date.UTC(year, month - 1, day, hour, minute) - offset * 60 * 1000;
    if (Math.abs(nextUtc - utc) < 1000) break;
    utc = nextUtc;
  }

  return new Date(utc);
}

export function getTimeZoneOffset(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return (asUTC - date.getTime()) / 60000;
}
