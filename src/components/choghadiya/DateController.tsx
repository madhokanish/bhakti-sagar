"use client";

import StickyControlBar from "@/components/choghadiya/StickyControlBar";
import SwipeDateStrip from "@/components/choghadiya/SwipeDateStrip";
import { CityOption } from "@/lib/choghadiyaCities";
import type { ChoghadiyaCopy } from "@/lib/choghadiyaCopy";

type Props = {
  cityInput: string;
  onCityChange: (value: string) => void;
  onResolveCity: (value: string) => void;
  onSelectCity: (city: CityOption) => void;
  citySuggestions: CityOption[];
  recentCities: CityOption[];
  onUseLocation: () => void;
  tz: string;
  dateISO: string;
  onDateChange: (value: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onShare: () => void;
  labels: Pick<
    ChoghadiyaCopy,
    "city_placeholder" | "city_aria" | "go" | "use_location" | "share_aria" | "prev" | "today" | "next"
  >;
};

export default function DateController(props: Props) {
  return (
    <div className="space-y-2">
      <StickyControlBar {...props} />
      <SwipeDateStrip dateISO={props.dateISO} tz={props.tz} onDateChange={props.onDateChange} />
    </div>
  );
}
