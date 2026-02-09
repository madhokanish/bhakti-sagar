export type CityOption = {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  tz: string;
  country?: string;
};

export const cities: CityOption[] = [
  { slug: "london", name: "London, UK", lat: 51.5072, lon: -0.1276, tz: "Europe/London" },
  { slug: "new-york", name: "New York, USA", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { slug: "toronto", name: "Toronto, Canada", lat: 43.6532, lon: -79.3832, tz: "America/Toronto" },
  { slug: "dubai", name: "Dubai, UAE", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" },
  { slug: "sydney", name: "Sydney, Australia", lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney" },
  { slug: "singapore", name: "Singapore", lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore" },
  { slug: "delhi", name: "Delhi, India", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" },
  { slug: "mumbai", name: "Mumbai, India", lat: 19.076, lon: 72.8777, tz: "Asia/Kolkata" }
];

export function findCityBySlug(slug?: string) {
  return cities.find((city) => city.slug === slug);
}
