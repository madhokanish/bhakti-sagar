import { cities, findCityBySlug, CityOption } from "@/lib/choghadiyaCities";
import { getLocalDateISO } from "@/lib/choghadiya";
import { siteConfig } from "@/lib/seo";

export type SearchParams = Record<string, string | string[] | undefined>;

export type ChoghadiyaInitialState = {
  initialCity?: CityOption;
  initialCityName?: string;
  initialCitySlug?: string;
  initialLat?: number | null;
  initialLon?: number | null;
  initialTz: string;
  initialDate: string;
  initialMode: "auto" | "manual";
  initialSunrise?: string;
  initialSunset?: string;
  initialNextSunrise?: string;
  initialPathBase: string;
  hasTzParam: boolean;
  hasDateParam: boolean;
  plannerGoal?: string;
  plannerWindow?: string;
  plannerStart?: string;
  plannerEnd?: string;
  cityLabel: string;
  dateLabel: string;
  canonicalUrl: string;
};

function getParam(searchParams: SearchParams | undefined, key: string) {
  if (!searchParams) return undefined;
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseNumber(value?: string) {
  const num = value ? Number(value) : NaN;
  return Number.isFinite(num) ? num : undefined;
}

function formatDateLabel(dateISO: string, timeZone: string) {
  const [year, month, day] = dateISO.split("-").map((val) => parseInt(val, 10));
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0));
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

export function resolveChoghadiyaState({
  params,
  searchParams,
  pathnameBase
}: {
  params?: { citySlug?: string };
  searchParams?: SearchParams;
  pathnameBase: string;
}): ChoghadiyaInitialState {
  const slug = params?.citySlug;
  const cityFromSlug = slug ? findCityBySlug(slug) : undefined;
  const cityParam = getParam(searchParams, "city");
  const cityMatch = cityParam
    ? cities.find((city) => city.name.toLowerCase() === cityParam.toLowerCase())
    : undefined;
  const latParam = parseNumber(getParam(searchParams, "lat"));
  const lonParam = parseNumber(getParam(searchParams, "lon"));
  const tzParam = getParam(searchParams, "tz");
  const dateParam = getParam(searchParams, "date");
  const modeParam = getParam(searchParams, "mode");
  const sunriseParam = getParam(searchParams, "sunrise");
  const sunsetParam = getParam(searchParams, "sunset");
  const nextSunriseParam = getParam(searchParams, "nextSunrise");
  const plannerGoal = getParam(searchParams, "goal");
  const plannerWindow = getParam(searchParams, "window");
  const plannerStart = getParam(searchParams, "start");
  const plannerEnd = getParam(searchParams, "end");

  const fallbackCity = cities[0];
  const initialCity =
    cityFromSlug ?? cityMatch ?? (latParam == null && lonParam == null ? fallbackCity : undefined);
  const initialLat = latParam ?? initialCity?.lat ?? undefined;
  const initialLon = lonParam ?? initialCity?.lon ?? undefined;
  const initialTz = tzParam ?? initialCity?.tz ?? "UTC";
  const initialDate = dateParam ?? getLocalDateISO(initialTz);
  const initialMode = modeParam === "manual" ? "manual" : "auto";

  const cityLabel = cityParam ?? initialCity?.name ?? "your location";
  const cityInput = cityParam ?? initialCity?.name ?? "";
  const dateLabel = formatDateLabel(initialDate, initialTz);

  const canonicalParams = new URLSearchParams();
  if (cityLabel) canonicalParams.set("city", cityLabel);
  if (initialDate) canonicalParams.set("date", initialDate);
  const canonicalUrl = `${siteConfig.url}${pathnameBase}${canonicalParams.toString() ? `?${canonicalParams.toString()}` : ""}`;

  return {
    initialCity,
    initialCityName: cityInput,
    initialCitySlug: initialCity?.slug,
    initialLat: initialLat ?? null,
    initialLon: initialLon ?? null,
    initialTz,
    initialDate,
    initialMode,
    initialSunrise: sunriseParam,
    initialSunset: sunsetParam,
    initialNextSunrise: nextSunriseParam,
    initialPathBase: pathnameBase,
    hasTzParam: Boolean(tzParam),
    hasDateParam: Boolean(dateParam),
    plannerGoal,
    plannerWindow,
    plannerStart,
    plannerEnd,
    cityLabel,
    dateLabel,
    canonicalUrl
  };
}
