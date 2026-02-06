import { NextResponse } from "next/server";
import { getSunTimes } from "@/lib/sun";

type CacheEntry = {
  data: {
    sunrise: string;
    sunset: string;
    nextSunrise: string | null;
  };
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const TTL = 1000 * 60 * 60 * 24 * 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const date = searchParams.get("date");
  const tz = searchParams.get("tz") ?? "UTC";

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !date) {
    return NextResponse.json({ error: "Missing lat, lon or date" }, { status: 400 });
  }

  const key = `${lat}:${lon}:${date}:${tz}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const times = getSunTimes(date, lat, lon);
  if (!times || !times.nextSunrise) {
    return NextResponse.json({ error: "Sunrise/sunset unavailable for this location/date." }, { status: 422 });
  }

  const payload = {
    sunrise: times.sunrise.toISOString(),
    sunset: times.sunset.toISOString(),
    nextSunrise: times.nextSunrise.toISOString()
  };

  cache.set(key, { data: payload, expiresAt: Date.now() + TTL });

  return NextResponse.json(payload);
}
