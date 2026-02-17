"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, getPlanSchedule, type WeeklyPlan } from "@/app/online-puja/plans";
import FAQAccordion from "@/components/online-puja/FAQAccordion";
import MobileStickyCTA from "@/components/online-puja/MobileStickyCTA";
import { trackEvent } from "@/lib/analytics";
import type { SupportedCurrency } from "@/lib/subscription";

type Props = {
  plan: WeeklyPlan;
  currency: SupportedCurrency;
};

function formatDateTime(date: Date, timeZone: string) {
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

function getCutoffCountdown(cutoffAt: Date) {
  const diff = cutoffAt.getTime() - Date.now();
  if (diff <= 0) return "Cutoff passed, join next week";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `Cutoff in ${days}d ${hours}h`;
  return `Cutoff in ${hours}h ${minutes}m`;
}

export default function ShaniWeeklyMembershipPage({ plan, currency }: Props) {
  const [showIST, setShowIST] = useState(false);
  const localTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const schedule = useMemo(() => getPlanSchedule(plan), [plan]);
  const [countdownText, setCountdownText] = useState(() => getCutoffCountdown(schedule.cutoffAt));
  const reviewsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    trackEvent("shani_weekly_view", { page: "/online-puja/shani-weekly" });
  }, []);

  useEffect(() => {
    setCountdownText(getCutoffCountdown(schedule.cutoffAt));
    const timer = window.setInterval(() => {
      setCountdownText(getCutoffCountdown(schedule.cutoffAt));
    }, 30000);
    return () => window.clearInterval(timer);
  }, [schedule.cutoffAt]);

  useEffect(() => {
    const target = reviewsRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        trackEvent("shani_weekly_review_visible", { section: "reviews" });
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const monthlyPrice = formatCurrency(plan.priceMonthly[currency], currency);
  const displayZone = showIST ? "Asia/Kolkata" : localTimeZone;
  const nextSessionLabel = formatDateTime(schedule.nextOccurrence, displayZone);
  const istLabel = formatDateTime(schedule.nextOccurrence, "Asia/Kolkata");
  const joinHref = "/subscribe?plan=shani";

  const faqItems = [
    {
      id: "name-in-sankalp",
      question: "What does “in your name” mean?",
      answer: "Your name is included in sankalp recitation every Saturday as part of the weekly ritual."
    },
    {
      id: "missing-live",
      question: "What if I miss the live puja?",
      answer: "You can watch the replay later. Live attendance is not mandatory."
    },
    {
      id: "cancel-anytime",
      question: "Can I cancel anytime?",
      answer: "Yes. You can manage and cancel membership from billing settings."
    },
    {
      id: "outside-india",
      question: "Is this available outside India?",
      answer: "Yes. Timing is shown in your local timezone with IST reference for clarity."
    },
    {
      id: "gotra",
      question: "Do I need gotra?",
      answer: "Gotra is optional. If you do not know it, you can leave it blank."
    },
    {
      id: "reminders",
      question: "How do reminders work?",
      answer: "You receive reminders before the weekly puja schedule so you can stay consistent."
    }
  ];

  return (
    <div className="container py-8 pb-24">
      <section
        id="shani-weekly-hero"
        className="overflow-hidden rounded-[2rem] border border-sagar-amber/25 bg-gradient-to-br from-[#2a150e] via-[#3a2014] to-[#1f120e] text-sagar-cream shadow-sagar-soft"
      >
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="p-6 md:p-8">
            <h1 className="text-4xl font-serif leading-tight text-[#f7e7cf] md:text-5xl">Weekly Shani Membership</h1>
            <p className="mt-3 max-w-xl text-base text-[#f2d8ba]/90">
              Every Saturday. 4 pujas per month in your name. A calm weekly ritual to seek steadiness,
              discipline, and stability.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-sagar-amber/35 bg-black/25 px-3 py-1 text-xs font-semibold text-[#f7e7cf]">
                Every Saturday
              </span>
              <span className="rounded-full border border-sagar-amber/35 bg-black/25 px-3 py-1 text-xs font-semibold text-[#f7e7cf]">
                4 per month included
              </span>
              <span className="rounded-full border border-sagar-amber/35 bg-black/25 px-3 py-1 text-xs font-semibold text-[#f7e7cf]">
                Next puja: {nextSessionLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowIST((value) => !value)}
              className="mt-2 text-xs font-semibold text-sagar-amber hover:text-[#ffd89a]"
            >
              {showIST ? "Switch to local time" : "Switch to IST"}
            </button>
            <p className="mt-1 text-xs text-[#f2d8ba]/80">IST: {istLabel}</p>

            <p className="mt-3 text-sm font-semibold text-[#f7e7cf]">Add your name for this Saturday. {countdownText}</p>

            <Link
              href={joinHref}
              onClick={() => trackEvent("shani_weekly_cta_click", { placement: "hero" })}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white hover:bg-sagar-ember"
            >
              Join membership
            </Link>
            <p className="mt-3 text-sm text-[#f2d8ba]/85">Cancel anytime. Replay and certificate included.</p>
            <p className="mt-2 text-sm text-[#f2d8ba]/85">{monthlyPrice} per month</p>
          </div>

          <div className="relative min-h-[280px]">
            <Image
              src={plan.heroImage}
              alt="Weekly Shani Membership"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft">
        <h2 className="text-3xl font-serif text-sagar-ink">Why devotees do Shani puja weekly</h2>
        <p className="mt-3 text-base text-sagar-ink/78">
          Shani Dev is worshipped as the deity of karma, discipline, and justice. Many devotees turn to this
          Saturday ritual when life feels heavy, delayed, or uncertain.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-sagar-amber/25 bg-gradient-to-br from-[#3a2218] to-[#2a160f] p-4 text-[#f7e7cf]">
            <h3 className="text-2xl font-serif">Relief when life feels stuck</h3>
            <p className="mt-2 text-sm text-[#f7e7cf]/85">A weekly ritual to seek steadiness during long delays and difficult phases.</p>
          </article>
          <article className="rounded-2xl border border-sagar-amber/25 bg-gradient-to-br from-[#3a2218] to-[#2a160f] p-4 text-[#f7e7cf]">
            <h3 className="text-2xl font-serif">Discipline and inner strength</h3>
            <p className="mt-2 text-sm text-[#f7e7cf]/85">Traditionally associated with patience, responsibility, and consistent effort.</p>
          </article>
          <article className="rounded-2xl border border-sagar-amber/25 bg-gradient-to-br from-[#3a2218] to-[#2a160f] p-4 text-[#f7e7cf]">
            <h3 className="text-2xl font-serif">Protection and stability</h3>
            <p className="mt-2 text-sm text-[#f7e7cf]/85">A calm Saturday sankalp to seek stability for home, work, and mind.</p>
          </article>
        </div>
      </section>

      <section className="mt-6 grid gap-4 rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-serif text-sagar-ink">What you receive every Saturday</h2>
          <ul className="mt-3 space-y-2 text-sm text-sagar-ink/78">
            <li>• Name included in sankalp weekly (automatically)</li>
            <li>• Live darshan access</li>
            <li>• Replay link after puja</li>
            <li>• Certificate PDF after each puja</li>
            <li>• Support on WhatsApp and email</li>
            <li>• Cancel anytime</li>
          </ul>
        </div>

        <div>
          <h2 className="text-3xl font-serif text-sagar-ink">Who this membership is for</h2>
          <ul className="mt-3 space-y-2 text-sm text-sagar-ink/78">
            <li>• You feel stuck or delayed despite effort</li>
            <li>• You want a steady Saturday routine for calm and discipline</li>
            <li>• You are going through a heavy period and want steadiness and strength</li>
            <li>• You want a weekly sankalp in your name without managing bookings</li>
          </ul>
        </div>
      </section>

      {/* TODO: Replace sample reviews with real user reviews from DB/CMS before scaling paid traffic. */}
      <section ref={reviewsRef} className="mt-6">
        <h2 className="text-3xl font-serif text-sagar-ink">Life change stories from members</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
            <p className="text-sm font-semibold text-sagar-ink">Rohit · London</p>
            <p className="mt-2 text-sm text-sagar-ink/78"><span className="font-semibold">Before:</span> I felt like life was moving slowly and I was constantly anxious.</p>
            <p className="mt-2 text-sm text-sagar-ink/78"><span className="font-semibold">After:</span> The Saturday ritual gave me routine and calm. Hearing the sankalp in my name made it feel personal.</p>
            <p className="mt-2 text-sm text-sagar-ink/78"><span className="font-semibold">Detail:</span> I watch the replay when I miss live.</p>
          </article>
          <article className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
            <p className="text-sm font-semibold text-sagar-ink">Meera · Toronto</p>
            <p className="mt-2 text-sm text-sagar-ink/78"><span className="font-semibold">Before:</span> I was overwhelmed and felt stuck in a long phase.</p>
            <p className="mt-2 text-sm text-sagar-ink/78"><span className="font-semibold">After:</span> This became my anchor. It reminds me to stay disciplined and patient.</p>
            <p className="mt-2 text-sm text-sagar-ink/78"><span className="font-semibold">Detail:</span> The certificate helps me feel it truly happened.</p>
          </article>
          <article className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
            <p className="text-sm font-semibold text-sagar-ink">Ankit · Dubai</p>
            <p className="mt-2 text-sm text-sagar-ink/78"><span className="font-semibold">Before:</span> I wanted something steady I could do every week, not occasional rituals.</p>
            <p className="mt-2 text-sm text-sagar-ink/78"><span className="font-semibold">After:</span> Now Saturday feels complete. It is less about fear and more about steadiness.</p>
            <p className="mt-2 text-sm text-sagar-ink/78"><span className="font-semibold">Detail:</span> The reminders and replay make it easy.</p>
          </article>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-sagar-amber/20 bg-gradient-to-br from-[#2f1a12] to-[#24140f] p-5 text-[#f7e7cf] shadow-sagar-soft">
        <h2 className="text-3xl font-serif">A calm, respectful way to worship</h2>
        <p className="mt-3 text-sm text-[#f7e7cf]/85">
          No fear based claims. This is a traditional Saturday puja performed with devotion. Many devotees
          find peace in consistency.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-sagar-amber/35 bg-black/20 px-3 py-1">Temple verified</span>
          <span className="rounded-full border border-sagar-amber/35 bg-black/20 px-3 py-1">Secure payments</span>
          <span className="rounded-full border border-sagar-amber/35 bg-black/20 px-3 py-1">Support on WhatsApp and email</span>
        </div>
      </section>

      <div className="mt-8">
        <FAQAccordion
          items={faqItems}
          title="Membership FAQs"
          sectionId="shani-weekly-faq"
          analyticsEventName="shani_weekly_faq_expand"
          analyticsContext="shani_weekly"
        />
      </div>

      <div className="mt-6">
        <Link
          href={joinHref}
          onClick={() => trackEvent("shani_weekly_cta_click", { placement: "bottom" })}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white hover:bg-sagar-ember"
        >
          Join membership
        </Link>
      </div>

      <MobileStickyCTA
        targetId="shani-weekly-hero"
        label="Join membership"
        priceLabel={`Shani: ${monthlyPrice} / month`}
        onClick={() => {
          trackEvent("shani_weekly_cta_click", { placement: "sticky" });
          window.location.href = joinHref;
        }}
      />
    </div>
  );
}
