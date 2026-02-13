"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeliverablesTimeline from "@/components/online-puja/DeliverablesTimeline";
import TrustChipsRow from "@/components/online-puja/TrustChipsRow";
import { trackEvent } from "@/lib/analytics";
import {
  convertGBPToCurrency,
  detectUserCurrency,
  formatPujaAmount,
  getNextPujaOccurrence,
  getPujaOfferPrice,
  type OnlinePuja
} from "@/lib/onlinePuja";
import type { PujaCardOption } from "@/lib/onlinePujaDetailConfig";

type Props = {
  puja: OnlinePuja;
  options: PujaCardOption[];
  deliverables: Array<{ stage: string; text: string }>;
};

type TimeMode = "local" | "ist";
type SampleType = "certificate" | "video" | null;

function formatInTz(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz
  }).format(date);
}

function getLocaleCurrency() {
  if (typeof window === "undefined") {
    return { locale: "en-GB", timeZone: "Europe/London", currency: "GBP" };
  }

  const locale = navigator.language || "en-GB";
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const currency = detectUserCurrency({ locale, timeZone, fallback: "GBP" });
  return { locale, timeZone, currency };
}

export default function StickyBookingCard({ puja, options, deliverables }: Props) {
  const [timeMode, setTimeMode] = useState<TimeMode>("local");
  const [selectedOption, setSelectedOption] = useState(options.find((opt) => opt.enabled !== false)?.id || "basic");
  const [sampleOpen, setSampleOpen] = useState<SampleType>(null);
  const [name, setName] = useState("");
  const [familyNames, setFamilyNames] = useState<string[]>([""]);
  const [gotra, setGotra] = useState("");
  const [note, setNote] = useState("");
  const [sankalpStarted, setSankalpStarted] = useState(false);

  const { locale, timeZone: localTimeZone, currency } = getLocaleCurrency();

  const nextOccurrence = getNextPujaOccurrence({
    weeklyDay: puja.weeklyDay,
    startTime: puja.startTime,
    timeZone: puja.timezone
  });

  const mainPrice = getPujaOfferPrice({ booking: puja.booking, currency });

  const localizedOptions = useMemo(
    () =>
      options
        .filter((opt) => opt.enabled !== false)
        .map((opt) => ({
          ...opt,
          amount: convertGBPToCurrency({ amountGBP: opt.priceGBP, currency }) ?? opt.priceGBP
        })),
    [currency, options]
  );

  const selectedOptionData = localizedOptions.find((opt) => opt.id === selectedOption) || localizedOptions[0];
  const selectedAmount = selectedOptionData?.amount || mainPrice.currentAmount;

  const timeDisplay = formatInTz(nextOccurrence, timeMode === "local" ? localTimeZone : puja.timezone);

  const checkoutHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("option", selectedOptionData?.id || "basic");
    params.set("name", name);
    params.set("family", familyNames.filter((item) => item.trim()).join(", "));
    params.set("gotra", gotra);
    params.set("note", note);
    params.set("cur", currency);
    params.set("amt", String(selectedAmount));
    return `/online-puja/${puja.slug}/checkout?${params.toString()}`;
  }, [currency, familyNames, gotra, name, note, puja.slug, selectedAmount, selectedOptionData?.id]);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `I need help booking ${puja.title} on Bhakti Sagar.`
  )}`;

  function onSankalpStart() {
    if (sankalpStarted) return;
    setSankalpStarted(true);
    trackEvent("sankalp_started", { seva_id: puja.id });
  }

  function onProceedClick() {
    trackEvent("proceed_to_payment_clicked", {
      seva_id: puja.id,
      option_id: selectedOptionData?.id || "basic"
    });

    if (name.trim().length > 1) {
      trackEvent("sankalp_completed", {
        seva_id: puja.id,
        has_family_names: familyNames.some((item) => item.trim().length > 0),
        has_gotra: Boolean(gotra.trim())
      });
    }
  }

  function openSample(type: SampleType) {
    setSampleOpen(type);
    if (type === "certificate") {
      trackEvent("certificate_sample_viewed", { seva_id: puja.id });
    }
    if (type === "video") {
      trackEvent("video_sample_viewed", { seva_id: puja.id });
    }
  }

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-[1.9rem] border border-sagar-amber/25 bg-white p-4 shadow-sagar-card md:p-5">
        <h2 className="text-4xl text-sagar-ink">Book Seva</h2>

        <div className="mt-3">
          <TrustChipsRow items={["4.8 Rating", "12,000+ devotees served", "Temple verified", "Secure payments"]} />
        </div>

        <div className="mt-3 rounded-2xl border border-sagar-amber/25 bg-sagar-cream/45 p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sagar-rose">Next Seva</p>
          <p className="mt-2 text-[1.72rem] leading-tight text-sagar-ink">{timeDisplay}</p>
          <button
            type="button"
            onClick={() => setTimeMode((prev) => (prev === "local" ? "ist" : "local"))}
            className="mt-1 text-xs font-medium text-sagar-ink/65 underline underline-offset-2"
          >
            Switch to see {timeMode === "local" ? "IST" : "Local time"}
          </button>
          <a
            href={`/api/online-puja/calendar?slug=${encodeURIComponent(puja.slug)}`}
            className="mt-3 inline-flex rounded-full border border-sagar-amber/30 bg-white px-3 py-1.5 text-xs font-semibold text-sagar-ink/78"
          >
            Add to calendar
          </a>
        </div>

        <div className="mt-4">
          <h3 className="text-xl font-semibold text-sagar-ink">1. Choose your seva</h3>
          <div className="mt-2 space-y-2">
            {localizedOptions.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sagar-amber/25 bg-sagar-cream/35 px-3 py-2.5"
              >
                <input
                  type="radio"
                  name="seva-option"
                  checked={selectedOption === option.id}
                  onChange={() => {
                    setSelectedOption(option.id);
                    trackEvent("seva_option_selected", { seva_id: puja.id, option_id: option.id });
                  }}
                  className="mt-1 h-4 w-4 accent-sagar-saffron"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xl font-medium text-sagar-ink">{option.label}</p>
                    <p className="text-lg font-semibold text-sagar-ink">
                      {formatPujaAmount({ amount: option.amount, currency, locale })}
                    </p>
                  </div>
                  {option.subtitle ? <p className="text-xs text-sagar-ink/65">{option.subtitle}</p> : null}
                  {option.badge ? <p className="mt-1 text-xs font-semibold text-sagar-ember">{option.badge}</p> : null}
                </div>
              </label>
            ))}
          </div>
          {mainPrice.isDiscounted ? (
            <p className="mt-2 text-xs text-emerald-700">
              Limited offer today: {formatPujaAmount({ amount: mainPrice.currentAmount, currency, locale })}
              <span className="ml-1 text-sagar-ink/55 line-through">
                {formatPujaAmount({ amount: mainPrice.originalAmount, currency, locale })}
              </span>
            </p>
          ) : null}
        </div>

        <details className="mt-4 rounded-2xl border border-sagar-amber/25 bg-sagar-cream/35 p-3" open>
          <summary className="cursor-pointer text-xl font-semibold text-sagar-ink">2. Personalise Sankalp</summary>
          <div className="mt-3 space-y-2.5 text-sm">
            <label className="block">
              <span className="mb-1 block text-sagar-ink/75">Name</span>
              <input
                required
                value={name}
                onFocus={onSankalpStart}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 outline-none focus:border-sagar-saffron"
              />
            </label>

            {familyNames.map((value, index) => (
              <label key={`family-${index}`} className="block">
                <span className="mb-1 block text-sagar-ink/75">Family names (optional)</span>
                <input
                  value={value}
                  onFocus={onSankalpStart}
                  onChange={(event) =>
                    setFamilyNames((prev) => prev.map((item, idx) => (idx === index ? event.target.value : item)))
                  }
                  className="w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 outline-none focus:border-sagar-saffron"
                />
              </label>
            ))}

            <button
              type="button"
              onClick={() => setFamilyNames((prev) => [...prev, ""])}
              className="text-xs font-semibold text-sagar-ember underline underline-offset-2"
            >
              Add more
            </button>

            <label className="block">
              <span className="mb-1 block text-sagar-ink/75">Gotra (optional)</span>
              <input
                value={gotra}
                onFocus={onSankalpStart}
                onChange={(event) => setGotra(event.target.value)}
                className="w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 outline-none focus:border-sagar-saffron"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sagar-ink/75">Note (optional)</span>
              <textarea
                value={note}
                onFocus={onSankalpStart}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-[72px] w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 outline-none focus:border-sagar-saffron"
              />
            </label>
          </div>
        </details>

        <div className="mt-4">
          <h3 className="text-xl font-semibold text-sagar-ink">3. You will receive</h3>
          <div className="mt-2 rounded-2xl border border-sagar-amber/25 bg-sagar-cream/35 p-3">
            <DeliverablesTimeline items={deliverables} />

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs">
              <button
                type="button"
                onClick={() => openSample("certificate")}
                className="font-semibold text-sagar-emerald underline underline-offset-2"
              >
                View certificate sample
              </button>
              <button
                type="button"
                onClick={() => openSample("video")}
                className="font-semibold text-sagar-emerald underline underline-offset-2"
              >
                See video sample
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-sagar-amber/25 bg-sagar-cream/30 px-3 py-2 text-xs text-sagar-ink/80">
          If the puja is not performed as scheduled, full refund.
        </div>

        <Link
          href={checkoutHref}
          onClick={onProceedClick}
          className="mt-4 inline-flex w-full min-h-[48px] items-center justify-center rounded-full bg-sagar-saffron px-5 py-2.5 text-base font-semibold text-white shadow-sagar-soft transition hover:bg-sagar-ember"
        >
          Proceed to payment
        </Link>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent("support_whatsapp_clicked", { seva_id: puja.id })}
            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-sagar-amber/30 bg-white px-3 text-sm font-semibold text-sagar-ink/80"
          >
            Ask on WhatsApp
          </a>
          <a
            href={`mailto:${puja.booking.supportEmail}`}
            onClick={() => trackEvent("support_email_clicked", { seva_id: puja.id })}
            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-sagar-amber/30 bg-white px-3 text-sm font-semibold text-sagar-ink/80"
          >
            Email support
          </a>
        </div>
      </section>

      {sampleOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-sagar-card">
            <p className="text-xl font-semibold text-sagar-ink">
              {sampleOpen === "certificate" ? "Certificate sample" : "Video sample"}
            </p>
            <p className="mt-2 text-sm text-sagar-ink/75">
              {sampleOpen === "certificate"
                ? "A personalised PDF certificate is shared after puja completion with your sankalp details."
                : "A private video update link is shared within 24 hours after the seva is completed."}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSampleOpen(null)}
                className="rounded-full border border-sagar-amber/30 px-4 py-2 text-sm font-semibold text-sagar-ink/75"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
