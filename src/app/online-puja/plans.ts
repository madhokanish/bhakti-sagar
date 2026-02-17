import { getLocalDateISO, getWeekdayForDate, toUTCDateFromLocal } from "@/lib/choghadiya";
import type { SupportedCurrency } from "@/lib/subscription";

export type MembershipMode = "membership" | "once";

export type WeeklyPlan = {
  id: "ganesh" | "shani";
  slug: string;
  deity: string;
  title: string;
  subtitle: string;
  traditionalNote: string;
  dayOfWeek: number;
  timeLocalIST: string;
  timezone: string;
  locationText: string;
  heroImage: string;
  cutoffHoursBefore: number;
  priceMonthly: Record<SupportedCurrency, number>;
  priceOnce: Record<SupportedCurrency, number>;
  stripePriceIds: {
    monthly: string;
    once: string;
  };
  includes: string[];
};

export const WEEKLY_PLANS: WeeklyPlan[] = [
  {
    id: "ganesh",
    slug: "ganesh-weekly",
    deity: "Ganesh",
    title: "Weekly Ganesh Vighnaharta Puja",
    subtitle: "For auspicious beginnings and steady progress.",
    traditionalNote: "Traditionally performed to seek clarity, focus, and removal of obstacles.",
    dayOfWeek: 3,
    timeLocalIST: "19:00",
    timezone: "Asia/Kolkata",
    locationText: "Ujjain",
    heroImage: "/images/online-puja/ganesh.png",
    cutoffHoursBefore: 24,
    priceMonthly: { GBP: 6.99, USD: 7.99, EUR: 6.99 },
    priceOnce: { GBP: 2.99, USD: 3.99, EUR: 2.99 },
    stripePriceIds: {
      monthly: "STRIPE_PRICE_ID_GANESH_MONTHLY",
      once: "STRIPE_PRICE_ID_GANESH_ONCE"
    },
    includes: ["Name in sankalp", "Live darshan access", "Replay available", "Confirmation after puja"]
  },
  {
    id: "shani",
    slug: "shani-weekly",
    deity: "Shani",
    title: "Weekly Shani Dev Puja",
    subtitle: "A Saturday ritual to seek stability, discipline, and relief during difficult periods.",
    traditionalNote: "Traditionally performed to seek steadiness, patience, and protection from prolonged delays.",
    dayOfWeek: 6,
    timeLocalIST: "19:00",
    timezone: "Asia/Kolkata",
    locationText: "Ujjain",
    heroImage: "/images/online-puja/shani.png",
    cutoffHoursBefore: 24,
    priceMonthly: { GBP: 7.99, USD: 8.99, EUR: 7.99 },
    priceOnce: { GBP: 3.49, USD: 4.49, EUR: 3.49 },
    stripePriceIds: {
      monthly: "STRIPE_PRICE_ID_SHANI_MONTHLY",
      once: "STRIPE_PRICE_ID_SHANI_ONCE"
    },
    includes: ["Name in sankalp", "Live darshan access", "Replay available", "Confirmation after puja"]
  }
];

export function normalizeMode(input: string | null | undefined): MembershipMode {
  return input === "once" ? "once" : "membership";
}

function shiftISODate(dateISO: string, days: number) {
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function resolveOccurrence(plan: WeeklyPlan, now: Date) {
  const todayISO = getLocalDateISO(plan.timezone);
  const todayWeekday = getWeekdayForDate(now, plan.timezone);
  const dayDelta = (plan.dayOfWeek - todayWeekday + 7) % 7;

  let targetDateISO = shiftISODate(todayISO, dayDelta);
  let occurrence = toUTCDateFromLocal({
    dateISO: targetDateISO,
    time: plan.timeLocalIST,
    timeZone: plan.timezone
  });

  if (occurrence.getTime() <= now.getTime()) {
    targetDateISO = shiftISODate(targetDateISO, 7);
    occurrence = toUTCDateFromLocal({
      dateISO: targetDateISO,
      time: plan.timeLocalIST,
      timeZone: plan.timezone
    });
  }

  return occurrence;
}

export function getPlanSchedule(plan: WeeklyPlan, now = new Date()) {
  const firstOccurrence = resolveOccurrence(plan, now);
  const firstCutoff = new Date(firstOccurrence.getTime() - plan.cutoffHoursBefore * 60 * 60 * 1000);

  if (firstCutoff.getTime() > now.getTime()) {
    return {
      nextOccurrence: firstOccurrence,
      cutoffAt: firstCutoff,
      rolledToNextWeek: false
    };
  }

  const nextWeekOccurrence = new Date(firstOccurrence.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    nextOccurrence: nextWeekOccurrence,
    cutoffAt: new Date(nextWeekOccurrence.getTime() - plan.cutoffHoursBefore * 60 * 60 * 1000),
    rolledToNextWeek: true
  };
}

export function getPlanById(planId: string | null | undefined) {
  if (!planId) return WEEKLY_PLANS[0];
  return WEEKLY_PLANS.find((plan) => plan.id === planId) || WEEKLY_PLANS[0];
}

export function formatCurrency(amount: number, currency: SupportedCurrency, locale = "en-GB") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
