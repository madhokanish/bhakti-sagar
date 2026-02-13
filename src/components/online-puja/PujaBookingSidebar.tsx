"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PujaCountdownCard from "@/components/online-puja/PujaCountdownCard";
import { formatPujaPrice, getNextPujaOccurrence, type WeeklyDay } from "@/lib/onlinePuja";
import { trackEvent } from "@/lib/analytics";

type Props = {
  puja: {
    id: string;
    slug: string;
    title: string;
    weeklyDay: WeeklyDay;
    startTime: string;
    timezone: string;
    temple: {
      name: string;
      city: string;
      state: string;
    };
    booking: {
      priceAmount: number;
      currency: string;
      supportEmail: string;
      refundPolicy: string;
    };
  };
};

type DisplayTz = "local" | "ist";

function formatInTimezone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone
  }).format(date);
}

export default function PujaBookingSidebar({ puja }: Props) {
  const [displayTz, setDisplayTz] = useState<DisplayTz>("local");

  const nextOccurrence = useMemo(
    () =>
      getNextPujaOccurrence({
        weeklyDay: puja.weeklyDay,
        startTime: puja.startTime,
        timeZone: puja.timezone
      }),
    [puja.startTime, puja.timezone, puja.weeklyDay]
  );

  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const primaryTimeZone = displayTz === "local" ? localTimeZone : puja.timezone;
  const secondaryTimeZone = displayTz === "local" ? puja.timezone : localTimeZone;

  const primaryLabel = formatInTimezone(nextOccurrence, primaryTimeZone);
  const secondaryLabel = formatInTimezone(nextOccurrence, secondaryTimeZone);

  function onToggle(next: DisplayTz) {
    if (next === displayTz) return;
    trackEvent("timezone_toggle", {
      from: displayTz === "local" ? "local" : "ist",
      to: next === "local" ? "local" : "ist",
      seva_id: puja.id
    });
    setDisplayTz(next);
  }

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-[1.75rem] border border-sagar-amber/25 bg-white/95 p-4 shadow-sagar-card md:p-5">
        <h2 className="text-3xl text-sagar-ink md:text-[2rem]">Book Seva</h2>

        <div className="mt-3 rounded-2xl border border-sagar-amber/25 bg-sagar-cream/65 px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.19em] text-sagar-rose">Price</p>
          <p className="mt-1 text-xl font-semibold text-sagar-ink">{formatPujaPrice(puja.booking)}</p>
        </div>

        <div className="mt-3 rounded-2xl border border-sagar-amber/25 bg-sagar-cream/65 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onToggle("local")}
              className={`rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${
                displayTz === "local"
                  ? "border-sagar-saffron/45 bg-white text-sagar-ember"
                  : "border-sagar-amber/25 bg-transparent text-sagar-ink/65"
              }`}
            >
              Local time
            </button>
            <button
              type="button"
              onClick={() => onToggle("ist")}
              className={`rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${
                displayTz === "ist"
                  ? "border-sagar-saffron/45 bg-white text-sagar-ember"
                  : "border-sagar-amber/25 bg-transparent text-sagar-ink/65"
              }`}
            >
              IST
            </button>
          </div>
          <p className="mt-2 text-sm font-semibold text-sagar-ink">{primaryLabel}</p>
          <p className="mt-1 text-xs text-sagar-ink/62">Also: {secondaryLabel}</p>
        </div>

        <div className="mt-3">
          <PujaCountdownCard
            weeklyDay={puja.weeklyDay}
            startTime={puja.startTime}
            timeZone={puja.timezone}
            scheduleTimeZone={puja.timezone}
            displayTimeZone={primaryTimeZone}
          />
        </div>

        <div className="mt-3 rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">Temple</p>
          <p className="mt-1 text-sm leading-relaxed text-sagar-ink/80">
            {puja.temple.name}, {puja.temple.city}, {puja.temple.state}
          </p>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/55 px-3 py-2 text-sm font-medium text-sagar-ink/85">
            Verified schedule
          </div>
          <div className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/55 px-3 py-2 text-sm font-medium text-sagar-ink/85">
            Sankalp in your name
          </div>
          <div className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/55 px-3 py-2 text-sm font-medium text-sagar-ink/85">
            Email confirmations
          </div>
        </div>

        <Link
          href={`/online-puja/${puja.slug}/checkout`}
          onClick={() => trackEvent("cta_book_click", { seva_id: puja.id, source: "sidebar" })}
          className="mt-4 inline-flex w-full min-h-[46px] items-center justify-center rounded-full bg-sagar-saffron px-5 py-2.5 text-base font-semibold text-white shadow-sagar-soft transition hover:bg-sagar-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
        >
          Book Seva
        </Link>
        <a
          href={`mailto:${puja.booking.supportEmail}`}
          className="mt-3 inline-flex w-full min-h-[42px] items-center justify-center rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-sm font-semibold text-sagar-ink/75 transition hover:bg-sagar-cream/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
        >
          Need help?
        </a>

        <p className="mt-3 text-xs text-sagar-ink/65">{puja.booking.refundPolicy}</p>
      </div>
    </aside>
  );
}
