import { NextResponse } from "next/server";
import { CityOption } from "@/lib/choghadiyaCities";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ results: [] as CityOption[] });
  }

  const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=8&language=en&format=json`;

  try {
    const response = await fetch(endpoint, { next: { revalidate: 86400 } });
    if (!response.ok) {
      return NextResponse.json({ results: [] as CityOption[] }, { status: 200 });
    }
    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const normalized: CityOption[] = results
      .filter((item: any) => item?.name && item?.timezone && item?.latitude != null && item?.longitude != null)
      .map((item: any) => {
        const country = item.country ? String(item.country) : undefined;
        const admin1 = item.admin1 ? `, ${String(item.admin1)}` : "";
        const suffix = country ? `, ${country}` : "";
        const name = `${String(item.name)}${admin1}${suffix}`;
        return {
          slug: toSlug(`${String(item.name)}-${country ?? ""}-${String(item.timezone)}`),
          name,
          lat: Number(item.latitude),
          lon: Number(item.longitude),
          tz: String(item.timezone),
          country
        };
      });

    return NextResponse.json({ results: normalized });
  } catch {
    return NextResponse.json({ results: [] as CityOption[] }, { status: 200 });
  }
}
