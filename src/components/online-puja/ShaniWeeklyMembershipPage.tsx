"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, getPlanSchedule, type WeeklyPlan } from "@/app/online-puja/plans";
import CutoffCountdown from "@/components/online-puja/CutoffCountdown";
import FAQAccordion from "@/components/online-puja/FAQAccordion";
import MobileStickyCTA from "@/components/online-puja/MobileStickyCTA";
import { trackEvent } from "@/lib/analytics";
import { getDeityName } from "@/lib/terminology";
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

export default function ShaniWeeklyMembershipPage({ plan, currency }: Props) {
  const [showIST, setShowIST] = useState(false);
  const localTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const schedule = useMemo(() => getPlanSchedule(plan), [plan]);
  const reviewsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    trackEvent("shani_weekly_view", { page: "/online-puja/shani-weekly" });
  }, []);

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
  const shaniHeading = getDeityName("shani", "heading");

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

  const emotionalCards = [
    {
      title: "Relief when life feels stuck",
      copy: "A weekly ritual to seek steadiness during long delays and difficult phases.",
      icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 5v5l3.5 2"
    },
    {
      title: "Discipline and inner strength",
      copy: "Traditionally associated with patience, responsibility, and consistent effort.",
      icon: "M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z"
    },
    {
      title: "Protection and stability",
      copy: "A calm Saturday sankalp to seek stability for home, work, and mind.",
      icon: "M4 12l8-8 8 8v7H4z"
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
            <div className="flex flex-wrap items-center gap-2">
              <CutoffCountdown cutoffAt={schedule.cutoffAt} compact urgent />
              <span className="text-xs font-semibold text-sagar-amber">· Live from Ujjain</span>
            </div>
            <h1 className="mt-4 text-4xl font-serif leading-tight text-[#f7e7cf] md:text-5xl">Weekly {shaniHeading} Membership</h1>
            <p className="mt-3 max-w-xl text-base text-[#f2d8ba]/90">
              Every Saturday. 4 pujas per month in your name. A calm weekly ritual to seek steadiness,
              discipline, and stability.
            </p>

            <p className="mt-4 text-sm font-semibold text-[#f7e7cf]">
              Last chance to add your name for this Saturday. Miss the cutoff and you wait until next week.
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

            <div className="mt-5">
              <CutoffCountdown cutoffAt={schedule.cutoffAt} urgent />
            </div>

            <Link
              href={joinHref}
              onClick={() => trackEvent("shani_weekly_cta_click", { placement: "hero" })}
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-sagar-saffron px-8 py-3 text-base font-bold text-white shadow-lg shadow-sagar-saffron/25 transition hover:bg-sagar-ember hover:shadow-sagar-saffron/30 sm:w-auto"
            >
              Add my name before cutoff
            </Link>
            <p className="mt-3 text-sm text-[#f2d8ba]/85">Cancel anytime · Replay + certificate included · {monthlyPrice}/month</p>
          </div>

          <div className="relative min-h-[280px]">
            <Image
              src={plan.heroImage}
              alt={`Weekly ${shaniHeading} Membership`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
              priority
            />
            <div className="absolute bottom-3 left-3 rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
              Temple-verified · Live from Ujjain
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-8 overflow-hidden rounded-3xl border border-sagar-amber/20 bg-gradient-to-br from-[#fffaf2] via-[#fff2df] to-[#f9e6ca] p-5 shadow-sagar-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-sagar-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-sagar-saffron/15 blur-3xl" />
        <h2 className="text-3xl font-serif text-sagar-ink">Why devotees do {shaniHeading} Puja weekly</h2>
        <p className="mt-3 max-w-4xl text-base text-sagar-ink/82">
          Shani Dev is worshipped as the deity of karma, discipline, and justice. Many devotees turn to this
          Saturday ritual when life feels heavy, delayed, or uncertain.
        </p>
        <p className="mt-2 text-sm font-medium text-sagar-ink/90">
          Every week you wait is another Saturday without your name in the sankalp.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {emotionalCards.map((item) => (
            <article
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-sagar-amber/30 bg-gradient-to-br from-[#4a281b] via-[#3a1f15] to-[#26130d] p-4 shadow-[0_8px_24px_rgba(67,29,14,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(67,29,14,0.45)]"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-sagar-gold/20 blur-2xl transition group-hover:scale-110" />
              <div className="relative flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sagar-amber/50 bg-[#fff7ea14]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fbe8cd" strokeWidth="1.8" className="h-4 w-4">
                    <path d={item.icon} />
                  </svg>
                </span>
              </div>
              <h3 className="relative mt-3 text-[1.9rem] font-serif leading-tight text-[#fff3de] [text-shadow:0_1px_0_rgba(0,0,0,0.25)]">
                {item.title}
              </h3>
              <p className="relative mt-3 rounded-lg bg-black/30 px-2.5 py-2 text-sm font-medium leading-relaxed text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.35)]">
                {item.copy}
              </p>
            </article>
          ))}
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
        <p className="mt-2 text-sm text-sagar-ink/75">Join devotees from London, Mumbai, Toronto, Dubai, and more.</p>
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

      <section className="mt-6 overflow-hidden rounded-3xl border border-sagar-amber/30 bg-gradient-to-br from-[#2f1a12] to-[#24140f] p-6 text-[#f7e7cf] shadow-sagar-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif text-[#f7e7cf] md:text-3xl">Don&apos;t miss this Saturday&apos;s sankalp</h2>
            <p className="mt-2 text-sm text-[#f7e7cf]/90">
              Once cutoff passes, names for this week close. You&apos;ll have to wait until next Saturday.
            </p>
            <p className="mt-2 text-sm font-medium text-[#f7e7cf]">
              Add your name now. Membership includes weekly inclusion, live access, replay, and certificate.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CutoffCountdown cutoffAt={schedule.cutoffAt} compact urgent />
            </div>
          </div>
          <Link
            href={joinHref}
            onClick={() => trackEvent("shani_weekly_cta_click", { placement: "cutoff_section" })}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-sagar-saffron px-6 py-3 text-sm font-bold text-white transition hover:bg-sagar-ember"
          >
            Add my name now
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-sagar-amber/20 pt-4 text-xs font-semibold">
          <span className="rounded-full border border-sagar-amber/35 bg-black/20 px-3 py-1 text-[#f7e7cf]">Temple verified</span>
          <span className="rounded-full border border-sagar-amber/35 bg-black/20 px-3 py-1 text-[#f7e7cf]">Secure payments</span>
          <span className="rounded-full border border-sagar-amber/35 bg-black/20 px-3 py-1 text-[#f7e7cf]">Support on WhatsApp and email</span>
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

      <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Link
          href={joinHref}
          onClick={() => trackEvent("shani_weekly_cta_click", { placement: "bottom" })}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-sagar-saffron px-8 py-3 text-base font-bold text-white shadow-lg shadow-sagar-saffron/25 hover:bg-sagar-ember"
        >
          Add my name before cutoff
        </Link>
        <p className="text-sm text-sagar-ink/75">Don&apos;t let another Saturday pass without your name in the ritual.</p>
      </div>

      <MobileStickyCTA
        targetId="shani-weekly-hero"
        label="Add name before cutoff"
        priceLabel={`${shaniHeading}: ${monthlyPrice} / month`}
        onClick={() => {
          trackEvent("shani_weekly_cta_click", { placement: "sticky" });
          window.location.href = joinHref;
        }}
      />
    </div>
  );
}
