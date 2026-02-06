"use client";

import StickyControlBar from "@/components/choghadiya/StickyControlBar";
import SwipeDateStrip from "@/components/choghadiya/SwipeDateStrip";
import { CityOption } from "@/lib/choghadiyaCities";

type Props = {
  cityInput: string;
  onCityChange: (value: string) => void;
  citySuggestions: CityOption[];
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

export default function DateController(props: Props) {
  return (
    <div className="space-y-2">
      <StickyControlBar {...props} />
      <SwipeDateStrip dateISO={props.dateISO} tz={props.tz} onDateChange={props.onDateChange} />
    </div>
  );
}
