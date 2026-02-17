"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency, getPlanSchedule, type MembershipMode, type WeeklyPlan } from "@/app/online-puja/plans";
import type { SupportedCurrency } from "@/lib/subscription";
import CutoffCountdown from "@/components/online-puja/CutoffCountdown";

type Props = {
  plan: WeeklyPlan;
  mode: MembershipMode;
  currency: SupportedCurrency;
  locale: string;
  onPrimaryClick: (plan: WeeklyPlan) => void;
  onCardClick: (plan: WeeklyPlan) => void;
};

function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone
  }).format(date);
}

export default function WeeklyPlanCard({ plan, mode, currency, locale, onPrimaryClick, onCardClick }: Props) {
  const userTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const schedule = useMemo(() => getPlanSchedule(plan), [plan]);
  const [showIST, setShowIST] = useState(false);
  const monthlyPrice = formatCurrency(plan.priceMonthly[currency], currency, locale);
  const oncePrice = formatCurrency(plan.priceOnce[currency], currency, locale);

  return (
    <article
      id={`plan-${plan.id}`}
      className="overflow-hidden rounded-3xl border border-sagar-amber/25 bg-white shadow-sagar-soft"
      onClick={() => onCardClick(plan)}
    >
      <div className="relative aspect-[16/10]">
        <Image src={plan.heroImage} alt={`${plan.deity} weekly puja`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority={plan.id === "ganesh"} />
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">{plan.deity} Membership</p>
          <h3 className="mt-1 text-2xl font-serif text-sagar-ink">{plan.title}</h3>
          <p className="mt-1 text-sm text-sagar-ink/72">{plan.subtitle}</p>
          <p className="mt-2 text-xs text-sagar-ink/68">{plan.traditionalNote}</p>
        </div>

        <div className="grid gap-2 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-3 text-sm text-sagar-ink/78">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-sagar-amber/35 bg-white px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sagar-ink/80">
              Every {plan.dayOfWeek === 3 ? "Wednesday" : "Saturday"}
            </span>
            <span className="rounded-full border border-sagar-amber/35 bg-white px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sagar-ink/80">
              4 pujas per month included
            </span>
          </div>
          <p>
            <span className="font-semibold text-sagar-ink">Next puja:</span>{" "}
            {formatTime(schedule.nextOccurrence, showIST ? "Asia/Kolkata" : userTimeZone)}
          </p>
          <button
            type="button"
            className="w-fit text-xs font-semibold text-sagar-ember hover:text-sagar-saffron"
            onClick={(event) => {
              event.stopPropagation();
              setShowIST((value) => !value);
            }}
          >
            {showIST ? "Switch to local time" : "Switch to IST"}
          </button>
          <p className="text-xs text-sagar-ink/65">
            IST: {formatTime(schedule.nextOccurrence, "Asia/Kolkata")}
          </p>
          <p className="text-xs text-sagar-ink/65">Temple city: {plan.locationText}</p>
        </div>

        <CutoffCountdown cutoffAt={schedule.cutoffAt} compact />

        <div>
          {mode === "membership" ? (
            <>
              <p className="text-xl font-semibold text-sagar-ink">{monthlyPrice} / month</p>
              <p className="text-xs text-sagar-ink/65">Included in membership</p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-sagar-ink">{oncePrice} this week</p>
              <p className="text-xs text-sagar-ink/65">One seva for upcoming cycle</p>
            </>
          )}
        </div>

        <ul className="grid gap-1 text-sm text-sagar-ink/78">
          {plan.includes.slice(0, 4).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPrimaryClick(plan);
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-5 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember"
          >
            {mode === "membership" ? `Join ${plan.deity} membership` : `Book ${plan.deity} once`}
          </button>
          <Link
            href={`/online-puja/${plan.slug}`}
            onClick={(event) => event.stopPropagation()}
            className="text-sm font-semibold text-sagar-ember hover:text-sagar-saffron"
          >
            Learn more
          </Link>
        </div>
      </div>
    </article>
  );
}
