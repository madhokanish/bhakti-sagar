"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { SupportedCurrency } from "@/lib/subscription";
import { trackEvent } from "@/lib/analytics";
import {
  formatCurrency,
  getPlanSchedule,
  type WeeklyPlan
} from "@/app/online-puja/plans";
import CutoffCountdown from "@/components/online-puja/CutoffCountdown";
import FAQAccordion from "@/components/online-puja/FAQAccordion";
import MobileStickyCTA from "@/components/online-puja/MobileStickyCTA";

type Props = {
  plan: WeeklyPlan;
  currency: SupportedCurrency;
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

export default function MembershipPlanPage({ plan, currency }: Props) {
  const router = useRouter();
  const [showIST, setShowIST] = useState(false);
  const localTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const schedule = useMemo(() => getPlanSchedule(plan), [plan]);
  const currentTimeZone = showIST ? "Asia/Kolkata" : localTimeZone;

  const monthlyLabel = formatCurrency(plan.priceMonthly[currency], currency);
  const onceLabel = formatCurrency(plan.priceOnce[currency], currency);
  useEffect(() => {
    trackEvent("online_puja_view", { page: `/online-puja/${plan.slug}`, plan: plan.id });
  }, [plan.id, plan.slug]);

  const faqItems = [
    {
      id: "name-meaning",
      question: "What does in your name mean?",
      answer: "Your name is included in the sankalp recitation as part of the weekly ritual."
    },
    {
      id: "need-live",
      question: "Do I need to attend live?",
      answer: "No. You can watch live when available or use replay afterwards."
    },
    {
      id: "receive-items",
      question: "What do I receive after each puja?",
      answer: "Confirmation, replay access, and a certificate PDF are shared after completion."
    },
    {
      id: "cancel-anytime",
      question: "Can I cancel anytime?",
      answer: "Yes. Membership is self-serve and can be managed in billing settings."
    },
    {
      id: "outside-india",
      question: "Can I join from outside India?",
      answer: "Yes. We show your local timezone and IST reference for clarity."
    },
    {
      id: "reminders",
      question: "How do reminders work?",
      answer: "You receive email reminders and can opt in for WhatsApp updates."
    }
  ];

  return (
    <div className="container py-8 pb-24">
      <section
        id="membership-plan-hero"
        className="overflow-hidden rounded-[2rem] border border-sagar-amber/25 bg-gradient-to-br from-[#2a150e] via-[#3a2014] to-[#1f120e] text-sagar-cream shadow-sagar-soft"
      >
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-amber">Weekly membership</p>
            <h1 className="mt-2 text-4xl font-serif leading-tight text-[#f7e7cf] md:text-5xl">
              {plan.id === "ganesh" ? "Weekly Ganesh Membership" : "Weekly Shani Membership"}
            </h1>
            <p className="mt-2 text-sm text-[#f2d8ba]/90">
              {plan.id === "ganesh"
                ? "Every Wednesday. 4 pujas per month in your name."
                : "Every Saturday. 4 pujas per month in your name."}
            </p>

            <div className="mt-5 rounded-2xl border border-sagar-amber/35 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-amber">Add your name for this week</p>
              <p className="mt-2 text-sm text-[#f2d8ba]">Next puja: {formatTime(schedule.nextOccurrence, currentTimeZone)}</p>
              <button
                type="button"
                onClick={() => {
                  setShowIST((value) => !value);
                  trackEvent("membership_time_toggle", { plan: plan.id, to_ist: !showIST });
                }}
                className="mt-1 text-xs font-semibold text-sagar-amber hover:text-[#ffd89a]"
              >
                {showIST ? "Switch to local time" : "Switch to IST"}
              </button>
              <div className="mt-3">
                <CutoffCountdown cutoffAtIso={schedule.cutoffAt.toISOString()} rolledToNextWeek={schedule.rolledToNextWeek} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/subscribe?plan=${plan.id}&mode=monthly`}
                  onClick={() => trackEvent("membership_cta_click", { action: "join", plan: plan.id, source: "plan_page" })}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white hover:bg-sagar-ember"
                >
                  Join membership
                </Link>
                <Link
                  href={`/subscribe?plan=${plan.id}&mode=once`}
                  onClick={() => trackEvent("membership_cta_click", { action: "book_once", plan: plan.id, source: "plan_page" })}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/40 px-6 py-2 text-sm font-semibold text-[#f2d8ba]"
                >
                  Book once this week
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {/* Sample testimonials: replace with verified testimonials for this plan. */}
              {[
                { name: "Meera", city: "Mumbai", text: "I like the weekly structure and clear reminders." },
                { name: "Rohan", city: "Leeds", text: "Replay helps when I cannot attend live on time." }
              ].map((item) => (
                <article key={`${item.name}-${item.city}`} className="rounded-xl border border-sagar-amber/30 bg-black/20 p-3">
                  <p className="text-xs text-[#f2d8ba]/90">&quot;{item.text}&quot;</p>
                  <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sagar-amber">
                    {item.name} · {item.city}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-2 text-sm text-[#f2d8ba]/90 sm:grid-cols-2">
              <span className="rounded-xl border border-sagar-amber/30 bg-black/20 px-3 py-2">Temple verified</span>
              <span className="rounded-xl border border-sagar-amber/30 bg-black/20 px-3 py-2">Secure payments</span>
              <span className="rounded-xl border border-sagar-amber/30 bg-black/20 px-3 py-2">Support on WhatsApp and email</span>
            </div>
          </div>

          <div className="relative min-h-[280px]">
            <Image src={plan.heroImage} alt={`${plan.deity} weekly membership`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" priority />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft lg:grid-cols-2" id="deliverables">
        <div>
          <h2 className="text-2xl font-serif text-sagar-ink">Deliverables every week</h2>
          <ul className="mt-3 space-y-2 text-sm text-sagar-ink/78">
            <li>• Instant: booking confirmation email</li>
            <li>• Before puja: sankalp confirmation in your name</li>
            <li>• After puja (within 24h): video update link</li>
            <li>• After puja (within 24h): certificate PDF</li>
            <li>• Cancel anytime</li>
          </ul>
        </div>
        <div>
          <h3 className="text-2xl font-serif text-sagar-ink">Who this is for</h3>
          <ul className="mt-3 space-y-2 text-sm text-sagar-ink/78">
            {plan.id === "shani" ? (
              <>
                <li>• Feeling stuck or uncertain</li>
                <li>• Seeking stability and discipline</li>
                <li>• Want a consistent Saturday ritual</li>
              </>
            ) : (
              <>
                <li>• Starting something new</li>
                <li>• Seeking focus and steady progress</li>
                <li>• Want a consistent Wednesday ritual</li>
              </>
            )}
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft">
        <h2 className="text-2xl font-serif text-sagar-ink">Membership plan</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <article className="rounded-2xl border border-sagar-amber/25 bg-sagar-cream/45 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">Primary</p>
            <h3 className="mt-1 text-lg font-semibold text-sagar-ink">Monthly membership</h3>
            <p className="mt-1 text-sm text-sagar-ink/72">{monthlyLabel} / month · includes 4 weekly pujas</p>
          </article>
          <article className="rounded-2xl border border-sagar-amber/25 bg-sagar-cream/45 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">Optional</p>
            <h3 className="mt-1 text-lg font-semibold text-sagar-ink">Extended sankalp add-on</h3>
            <p className="mt-1 text-sm text-sagar-ink/72">Optional add-on for detailed sankalp names and intention notes.</p>
            <p className="mt-2 text-xs text-sagar-ink/65">One-time booking remains available as a secondary option.</p>
          </article>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-serif text-sagar-ink">Traditionally performed to seek</h2>
        <div className="mt-3 grid gap-3 rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:grid-cols-2">
          <div>
            <ul className="space-y-2 text-sm text-sagar-ink/78">
              {plan.id === "shani" ? (
                <>
                  <li>• Stability during difficult periods</li>
                  <li>• Discipline, patience, and calm</li>
                  <li>• Steadiness during prolonged delays</li>
                </>
              ) : (
                <>
                  <li>• Clarity for new beginnings</li>
                  <li>• Focus and steady progress</li>
                  <li>• Removal of routine obstacles</li>
                </>
              )}
            </ul>
          </div>
          <div className="grid gap-3">
            {/* Sample testimonials: replace with verified testimonials when available. */}
            {[
              { name: "Meera", city: "Mumbai", text: "The weekly rhythm helps me stay consistent with my sankalp." },
              { name: "Rohan", city: "Leeds", text: "I watch replay when I miss live and still feel connected." },
              { name: "Vandana", city: "Pune", text: "Schedule and reminders are clear, and support replies quickly." }
            ].map((item) => (
              <article
                key={`${item.name}-${item.city}`}
                className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-4"
              >
                <p className="text-sm text-sagar-ink/78">&quot;{item.text}&quot;</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-sagar-rose">
                  {item.name} · {item.city}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-8">
        <FAQAccordion items={faqItems} title="Membership FAQs" sectionId="faq" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/subscribe?plan=${plan.id}&mode=monthly`}
          onClick={() => trackEvent("membership_cta_click", { action: "join", plan: plan.id, source: "bottom_cta" })}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white hover:bg-sagar-ember"
        >
          Join membership
        </Link>
        <Link
          href={`/subscribe?plan=${plan.id}&mode=once`}
          onClick={() => trackEvent("membership_cta_click", { action: "book_once", plan: plan.id, source: "bottom_cta" })}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/30 px-6 py-2 text-sm font-semibold text-sagar-ink/75"
        >
          Book once this week ({onceLabel})
        </Link>
      </div>

      <MobileStickyCTA
        targetId="membership-plan-hero"
        label="Join membership"
        priceLabel={`${plan.deity}: ${monthlyLabel} / month`}
        onClick={() => {
          trackEvent("membership_cta_click", { action: "join", plan: plan.id, source: "sticky" });
          router.push(`/subscribe?plan=${plan.id}&mode=monthly`);
        }}
      />
    </div>
  );
}
