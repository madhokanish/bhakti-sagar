import { ChoghadiyaLabel, ChoghadiyaName } from "@/lib/choghadiya";

type SlotMeta = {
  emoji: string;
  labelText: string;
  goodHint?: string;
  avoidHint?: string;
};

const metaMap: Record<ChoghadiyaName, SlotMeta> = {
  Amrit: {
    emoji: "✨",
    labelText: "Best",
    goodHint: "Good for most new starts and important tasks."
  },
  Shubh: {
    emoji: "✅",
    labelText: "Good",
    goodHint: "Good for devotional and auspicious work."
  },
  Labh: {
    emoji: "💰",
    labelText: "Gain",
    goodHint: "Good for gains, progress, and results."
  },
  Char: {
    emoji: "🚶",
    labelText: "Neutral",
    goodHint: "Good for travel and movement."
  },
  Rog: {
    emoji: "⚠️",
    labelText: "Avoid",
    avoidHint: "Usually avoided for starting important work."
  },
  Kaal: {
    emoji: "⛔",
    labelText: "Avoid",
    avoidHint: "Usually avoided for auspicious beginnings."
  },
  Udveg: {
    emoji: "😟",
    labelText: "Avoid",
    avoidHint: "Usually avoided when seeking calm outcomes."
  }
};

export function getSlotMeta(name: ChoghadiyaName): SlotMeta {
  return metaMap[name];
}

export function labelTextFromLabel(label: ChoghadiyaLabel) {
  if (label === "Best") return "Best";
  if (label === "Good") return "Good";
  if (label === "Gain") return "Gain";
  if (label === "Neutral") return "Neutral";
  return "Avoid";
}
