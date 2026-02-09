"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CityOption } from "@/lib/choghadiyaCities";

type Props = {
  cityInput: string;
  onCityChange: (value: string) => void;
  onResolveCity: (value: string) => void;
  onSelectCity: (city: CityOption) => void;
  citySuggestions: CityOption[];
  recentCities: CityOption[];
  onUseLocation: () => void;
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
  onResolveCity,
  onSelectCity,
  citySuggestions,
  recentCities,
  onUseLocation,
  dateISO,
  onDateChange,
  onPrevDay,
  onNextDay,
  onToday,
  onShare
}: Props) {
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const blurTimer = useRef<number | null>(null);

  const displaySuggestions = useMemo(() => {
    if (cityInput.trim().length > 0) return citySuggestions;
    return recentCities;
  }, [cityInput, citySuggestions, recentCities]);

  useEffect(() => {
    if (!openSuggestions) return;
    setActiveIndex(displaySuggestions.length > 0 ? 0 : null);
  }, [openSuggestions, displaySuggestions]);

  const handleSelectCity = (city: CityOption) => {
    onSelectCity(city);
    setOpenSuggestions(false);
    setActiveIndex(null);
  };

  const handleSubmitCity = () => {
    onResolveCity(cityInput);
    setOpenSuggestions(false);
  };

  return (
    <div className="sticky top-16 z-30 border-b border-sagar-amber/20 bg-sagar-cream/95 px-3 py-2 backdrop-blur md:top-20">
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-[62%]">
          <input
            value={cityInput}
            onChange={(e) => onCityChange(e.target.value)}
            onFocus={() => {
              if (blurTimer.current) window.clearTimeout(blurTimer.current);
              setOpenSuggestions(true);
            }}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => setOpenSuggestions(false), 150);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && displaySuggestions.length > 0) {
                event.preventDefault();
                setActiveIndex((prev) => {
                  if (prev == null) return 0;
                  return Math.min(displaySuggestions.length - 1, prev + 1);
                });
                return;
              }
              if (event.key === "ArrowUp" && displaySuggestions.length > 0) {
                event.preventDefault();
                setActiveIndex((prev) => {
                  if (prev == null) return displaySuggestions.length - 1;
                  return Math.max(0, prev - 1);
                });
                return;
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const selected = activeIndex != null ? displaySuggestions[activeIndex] : null;
                if (selected) {
                  handleSelectCity(selected);
                } else {
                  handleSubmitCity();
                }
              }
              if (event.key === "Escape") {
                setOpenSuggestions(false);
              }
            }}
            placeholder="Enter city (e.g. Chicago)"
            aria-label="City"
            className="w-full rounded-full border border-sagar-amber/30 bg-white px-3 py-1 text-xs outline-none"
          />
          {openSuggestions && displaySuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[110%] z-50 max-h-60 overflow-auto rounded-2xl border border-sagar-amber/30 bg-white p-2 shadow-sagar-soft">
              {displaySuggestions.map((city, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={city.slug}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelectCity(city);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-xs ${
                      active ? "bg-sagar-cream/70 text-sagar-ink" : "text-sagar-ink hover:bg-sagar-cream/70"
                    }`}
                  >
                    <span>{city.name}</span>
                    <span className="text-[0.6rem] text-sagar-ink/50">{city.country ?? city.tz}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmitCity}
          className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70"
        >
          Go
        </button>
        <button
          type="button"
          onClick={onUseLocation}
          className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70"
        >
          Use location
        </button>
        <button
          type="button"
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevDay}
            className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sagar-ink/70"
          >
            Today
          </button>
          <button
            type="button"
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
