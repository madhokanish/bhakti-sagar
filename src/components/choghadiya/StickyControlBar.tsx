"use client";

import { CityOption } from "@/lib/choghadiyaCities";

type Props = {
  cityInput: string;
  onCityChange: (value: string) => void;
  cities: CityOption[];
  onUseLocation: () => void;
  timeZones: string[];
  tz: string;
  onTimezoneChange: (value: string) => void;
  dateISO: string;
  onDateChange: (value: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onShare: () => void;
};

export default function StickyControlBar({
  cityInput,
  onCityChange,
  cities,
  onUseLocation,
  timeZones,
  tz,
  onTimezoneChange,
  dateISO,
  onDateChange,
  onPrevDay,
  onNextDay,
  onToday,
  onShare
}: Props) {
  return (
    <div className="sticky top-16 z-30 border-b border-sagar-amber/20 bg-sagar-cream/95 px-3 py-2 backdrop-blur md:top-20">
      <div className="flex items-center gap-2">
        <input
          list="city-list"
          value={cityInput}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City"
          aria-label="City"
          className="w-full max-w-[55%] rounded-full border border-sagar-amber/30 bg-white px-3 py-1 text-xs outline-none"
        />
        <datalist id="city-list">
          {cities.map((city) => (
            <option key={city.slug} value={city.name} />
          ))}
        </datalist>
        <button
          onClick={onUseLocation}
          className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70"
        >
          Use location
        </button>
        <button
          onClick={onShare}
          aria-label="Share"
          className="ml-auto rounded-full border border-sagar-amber/30 bg-white p-2 text-sagar-ink/60"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
            <path
              d="M15 8a3 3 0 1 0-2.83-4H12a3 3 0 0 0 3 3zm-6 4a3 3 0 1 0 2.83 4H12a3 3 0 0 0-3-3zm9-2.5a3 3 0 0 0-2.47 1.3l-4.29-2.2a3 3 0 0 0 0-1.2l4.29-2.2A3 3 0 1 0 15 5.5l-4.29 2.2a3 3 0 1 0 0 4.6l4.29 2.2A3 3 0 1 0 18 9.5z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          list="tz-list"
          value={tz}
          onChange={(e) => onTimezoneChange(e.target.value)}
          aria-label="Timezone"
          className="w-full max-w-[45%] rounded-full border border-sagar-amber/30 bg-white px-3 py-1 text-xs outline-none"
        />
        <datalist id="tz-list">
          {timeZones.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevDay}
            className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70"
          >
            Prev
          </button>
          <button
            onClick={onToday}
            className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70"
          >
            Today
          </button>
          <button
            onClick={onNextDay}
            className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70"
          >
            Next
          </button>
        </div>
        <input
          type="date"
          value={dateISO}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-xs"
        />
      </div>
    </div>
  );
}
