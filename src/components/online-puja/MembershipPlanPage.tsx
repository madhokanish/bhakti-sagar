"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { SupportedCurrency } from "@/lib/subscription";
import { trackEvent } from "@/lib/analytics";
import { getDeityName } from "@/lib/terminology";
import { formatCurrency, getPlanSchedule, type WeeklyPlan } from "@/app/online-puja/plans";
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
  const [showIST, setShowIST] = useState(false);
  const localTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const schedule = useMemo(() => getPlanSchedule(plan), [plan]);
  const currentTimeZone = showIST ? "Asia/Kolkata" : localTimeZone;
  const monthlyPrice = formatCurrency(plan.priceMonthly[currency], currency);
  const deityHeading = getDeityName(plan.id, "heading");
  const deityBody = getDeityName(plan.id, "body");

  useEffect(() => {
    trackEvent("plan_page_view", { plan: plan.id });
  }, [plan.id]);

  const faqItems = [
    {
      id: "name-meaning",
      question: "What does in your name mean?",
      answer: "Your name and gotra are included in sankalp recitation during the weekly ritual."
    },
    {
      id: "need-live",
      question: "Do I need to attend live?",
      answer: "No. Replay is available when you miss the live timing."
    },
    {
      id: "receive-items",
      question: "What do I receive after each puja?",
      answer: "You receive confirmation updates, replay access, and a certificate PDF."
    },
    {
      id: "cancel",
      question: "Can I cancel anytime?",
      answer: "Yes. Membership can be managed and cancelled from billing settings."
    },
    {
      id: "outside-india",
      question: "Can I join from outside India?",
      answer: "Yes. The schedule is shown in your local timezone with IST reference."
    },
    {
      id: "reminders",
      question: "How do reminders work?",
      answer: "Email reminders are sent before the weekly puja schedule."
    }
  ];

  const joinHref = `/subscribe?plan=${plan.id}`;

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
              {`Weekly ${deityHeading} Membership`}
            </h1>
            <p className="mt-2 text-sm text-[#f2d8ba]/90">
              {plan.id === "ganesh"
                ? "Every Wednesday. 4 pujas per month with your name and gotra in sankalp."
                : "Every Saturday. 4 pujas per month with your name and gotra in sankalp."}
            </p>
            <p className="mt-2 max-w-xl text-sm text-[#f2d8ba]/80">
              This {deityBody} online puja membership includes weekly sankalp with your name and gotra, live darshan access,
              replay, and certificate updates.
            </p>

            <div className="mt-5 rounded-2xl border border-sagar-amber/35 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-amber">Next session</p>
              <p className="mt-2 text-sm text-[#f2d8ba]">{formatTime(schedule.nextOccurrence, currentTimeZone)}</p>
              <button
                type="button"
                onClick={() => setShowIST((value) => !value)}
                className="mt-1 text-xs font-semibold text-sagar-amber hover:text-[#ffd89a]"
              >
                {showIST ? "Switch to local time" : "Switch to IST"}
              </button>
              <p className="mt-1 text-xs text-[#f2d8ba]/80">IST: {formatTime(schedule.nextOccurrence, "Asia/Kolkata")}</p>

              <Link
                href={joinHref}
                onClick={() => trackEvent("join_membership_click", { plan: plan.id, source: "hero" })}
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white hover:bg-sagar-ember"
              >
                Join membership
              </Link>
            </div>

            <p className="mt-4 text-sm text-[#f2d8ba]/85">{monthlyPrice} per month • includes 4 weekly pujas • cancel anytime</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {/* Placeholder testimonials: replace with verified testimonials. */}
              {[
                { name: "Meera", city: "Mumbai", text: "The weekly structure makes my sankalp consistent." },
                { name: "Rohan", city: "Leeds", text: "Replay helps when I cannot attend live." }
              ].map((item) => (
                <article key={`${item.name}-${item.city}`} className="rounded-xl border border-sagar-amber/30 bg-black/20 p-3">
                  <p className="text-xs text-[#f2d8ba]/90">&quot;{item.text}&quot;</p>
                  <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sagar-amber">
                    {item.name} · {item.city}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative min-h-[280px]">
            <Image
              src={plan.heroImage}
              alt={`${plan.deity} weekly membership`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft" id="deliverables">
        <h2 className="text-2xl font-serif text-sagar-ink">Deliverables every week</h2>
        <ul className="mt-3 space-y-2 text-sm text-sagar-ink/78">
          <li>• Name and gotra included in sankalp weekly</li>
          <li>• Live darshan access</li>
          <li>• Replay link after puja</li>
          <li>• Certificate PDF after puja</li>
        </ul>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-sagar-amber/20 bg-white shadow-sagar-soft">
        <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
          <div className="p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Sankalp Assurance</p>
            <h2 className="mt-2 text-2xl font-serif text-sagar-ink">Pandit ji will recite your name and gotra</h2>
            <p className="mt-2 text-sm text-sagar-ink/78">
              During the puja sankalp, pandit ji takes your submitted name and gotra as part of the ritual recitation.
            </p>
          </div>
          <div className="relative min-h-[240px]">
            <Image
              src="/images/online-puja/pandit-sankalp.png"
              alt="Pandit ji performing sankalp and reciting devotee name and gotra"
              fill
              className="object-contain bg-white p-2"
              sizes="(max-width: 768px) 100vw, 45vw"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft">
        <h2 className="text-2xl font-serif text-sagar-ink">Benefits</h2>
        <p className="mt-3 text-sm text-sagar-ink/78">{plan.traditionalNote}</p>
        {plan.id === "shani" ? (
          <ul className="mt-3 space-y-2 text-sm text-sagar-ink/78">
            <li>• Traditionally performed to seek stability and steadiness.</li>
            <li>• Supports discipline, patience, and calm during difficult phases.</li>
          </ul>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-sagar-ink/78">
            <li>• Traditionally performed in {deityBody} Puja to seek clarity and removal of obstacles.</li>
            <li>• Supports focus and steady progress in daily life.</li>
          </ul>
        )}
      </section>

      <section className="mt-8 grid gap-3 md:grid-cols-3">
        {/* Placeholder reviews: replace with verified user testimonials. */}
        {[
          { name: "Vandana", city: "Pune", text: "Schedule and reminders are clear each week." },
          { name: "Arjun", city: "Toronto", text: "Simple process and easy replay when I miss live." },
          { name: "Neha", city: "Delhi", text: "Consistent weekly format works well for my routine." }
        ].map((item) => (
          <article key={`${item.name}-${item.city}`} className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
            <p className="text-sm text-sagar-ink/78">&quot;{item.text}&quot;</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-sagar-rose">
              {item.name} · {item.city} <span className="text-sagar-gold">★★★★★</span>
            </p>
          </article>
        ))}
      </section>

      <div className="mt-8">
        <FAQAccordion items={faqItems} title="Membership FAQs" sectionId="faq" />
      </div>

      <div className="mt-6">
        <Link
          href={joinHref}
          onClick={() => trackEvent("join_membership_click", { plan: plan.id, source: "bottom" })}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white hover:bg-sagar-ember"
        >
          Join membership
        </Link>
      </div>

      <MobileStickyCTA
        targetId="membership-plan-hero"
        label="Join membership"
        priceLabel={`${plan.deity}: ${monthlyPrice} / month`}
        onClick={() => {
          trackEvent("join_membership_click", { plan: plan.id, source: "sticky" });
          window.location.href = joinHref;
        }}
      />
    </div>
  );
}
