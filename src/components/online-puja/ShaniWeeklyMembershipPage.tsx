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
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const localTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const schedule = useMemo(() => getPlanSchedule(plan), [plan]);
  const heroGalleryRef = useRef<HTMLDivElement | null>(null);
  const reviewsRef = useRef<HTMLElement | null>(null);
  const heroImages = useMemo(
    () => [
      { src: plan.heroImage, alt: "Shani Dev Puja live from Ujjain" },
      { src: "/images/online-puja/shani-weekly-2.png", alt: "Shani Dev Puja temple view" }
    ],
    [plan.heroImage]
  );

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

  useEffect(() => {
    const container = heroGalleryRef.current;
    if (!container) return;

    const updateActiveSlide = () => {
      const slideWidth = container.clientWidth || 1;
      const index = Math.round(container.scrollLeft / slideWidth);
      setActiveHeroIndex(Math.max(0, Math.min(heroImages.length - 1, index)));
    };

    container.addEventListener("scroll", updateActiveSlide, { passive: true });
    updateActiveSlide();
    return () => container.removeEventListener("scroll", updateActiveSlide);
  }, [heroImages.length]);

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
      answer: "Your name and gotra are included in sankalp recitation every Saturday as part of the weekly ritual."
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
      copy: "Delays, obstacles, feeling like nothing moves despite your effort. Weekly sankalp helps seek steadiness through difficult phases.",
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
      fear: "Stuck? Delays? Heavy phase?"
    },
    {
      title: "Discipline and inner strength",
      copy: "Shani Dev rewards patience and consistent effort. A weekly ritual builds inner strength when life tests you.",
      icon: "M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z",
      fear: "Need strength to endure?"
    },
    {
      title: "Protection and stability",
      copy: "Home, work, mind—seek stability in all areas. Devotees turn to Saturday puja when life feels shaky.",
      icon: "M4 12l8-8 8 8v7H4z",
      fear: "Life feels unstable?"
    }
  ];

  const deliverables = [
    { text: "Name and gotra in sankalp every Saturday (automatically)" },
    { text: "Live darshan access" },
    { text: "Replay link after puja" },
    { text: "Certificate PDF after each puja" },
    { text: "Support on WhatsApp and email" },
    { text: "Cancel anytime" }
  ];

  const whoItsFor = [
    { text: "You feel stuck or delayed despite effort—nothing seems to move", fear: true },
    { text: "You're going through a heavy phase and need steadiness", fear: true },
    { text: "You want a steady Saturday routine for calm and discipline", fear: false },
    { text: "You want weekly sankalp with your name and gotra without managing bookings", fear: false }
  ];

  const testimonials = [
    {
      name: "Rohit",
      location: "London",
      before: "Life was moving slowly. I was constantly anxious.",
      after: "The Saturday ritual gave me routine and calm. Hearing the sankalp with my name and gotra made it feel personal. It really worked.",
      detail: "I watch the replay when I miss live.",
      stars: 5
    },
    {
      name: "Meera",
      location: "Toronto",
      before: "Overwhelmed and stuck in a long difficult phase.",
      after: "This became my anchor. It reminds me to stay disciplined and patient. Things slowly started shifting.",
      detail: "The certificate helps me feel it truly happened.",
      stars: 5
    },
    {
      name: "Ankit",
      location: "Dubai",
      before: "Wanted something steady every week, not occasional rituals.",
      after: "Saturday feels complete now. Less about fear, more about steadiness. The weekly structure helped me through.",
      detail: "Reminders and replay make it easy.",
      stars: 5
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
              <span className="rounded-full border border-sagar-amber/35 bg-black/25 px-3 py-1 text-xs font-semibold text-[#f7e7cf]">
                1d 20h left
              </span>
              <span className="text-xs font-semibold text-sagar-amber">· Live from Ujjain</span>
            </div>
            <h1 className="mt-4 text-4xl font-serif leading-tight text-[#f7e7cf] md:text-5xl">{shaniHeading} Puja</h1>
            <p className="mt-2 text-lg font-semibold text-[#f7e7cf]">Every Saturday</p>
            <p className="mt-3 max-w-xl text-base text-[#f2d8ba]/90">
              4 pujas per month with your name and gotra in the sankalp.
            </p>
            <p className="mt-3 max-w-xl text-sm text-[#f2d8ba]/80">
              Book Shani Puja to reduce the malefic effects of Saturn and seek relief from Sade Sati, Shani Dosh, and obstacles. Pray for stability, protection, and the blessings of Lord Shani.
            </p>

            <div className="mt-4 space-y-2 rounded-xl border border-sagar-amber/30 bg-black/20 p-3">
              <p className="text-sm font-semibold text-[#f7e7cf]">
                Registrations for this Saturday close soon. Add your name and gotra right now.
              </p>
              <p className="text-sm text-[#f2d8ba]">
                Once the cutoff passes, your sankalp will not be taken this week and you will have to wait for next Saturday.
              </p>
            </div>

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

            <Link
              href={joinHref}
              onClick={() => trackEvent("shani_weekly_cta_click", { placement: "hero" })}
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-sagar-saffron px-8 py-3 text-base font-bold text-white shadow-lg shadow-sagar-saffron/25 transition hover:bg-sagar-ember hover:shadow-sagar-saffron/30 sm:w-auto"
            >
              Add my name and gotra before cutoff
            </Link>
            <p className="mt-3 text-sm text-[#f2d8ba]/85">Cancel anytime · Replay + certificate included · {monthlyPrice}/month</p>
          </div>

          <div className="flex min-h-[280px] flex-col">
            <div
              ref={heroGalleryRef}
              className="flex min-h-[280px] snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Shani Dev Puja image gallery"
            >
              {heroImages.map((image) => (
                <div key={image.src} className="relative min-h-[280px] w-full shrink-0 snap-start">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority={image.src === plan.heroImage}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <div className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                Temple-verified · Live from Ujjain
              </div>
              <div className="flex items-center gap-1.5" aria-label="Gallery pagination">
                {heroImages.map((image, index) => (
                  <span
                    key={image.src}
                    className={`h-2 w-2 rounded-full ${activeHeroIndex === index ? "bg-sagar-saffron" : "bg-sagar-amber/40"}`}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-8 overflow-hidden rounded-3xl border border-sagar-amber/20 bg-gradient-to-br from-[#fffbf5] via-[#fdf6eb] to-[#f9edd9] p-6 shadow-sagar-soft md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sagar-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-sagar-saffron/8 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-sagar-rose">Why devotees join</p>
          <h2 className="mt-2 text-3xl font-serif text-sagar-ink md:text-4xl">
            A way out of the difficult phase in life
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-sagar-ink/85">
            Shani Dev is worshipped as the deity of karma, discipline, and justice. When life feels heavy,
            delayed, or uncertain—many devotees turn to this Saturday ritual for steadiness and relief.
          </p>
          <p className="mt-4 rounded-xl border border-sagar-amber/30 bg-white/80 px-4 py-3 text-sm font-semibold text-sagar-ink shadow-sm">
            Every week you wait is another Saturday without your name and gotra in the sankalp.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {emotionalCards.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-sagar-amber/25 bg-white p-5 shadow-sagar-soft transition hover:-translate-y-0.5 hover:border-sagar-saffron/40 hover:shadow-sagar-card"
              >
                <div className="flex items-center justify-center gap-2 text-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sagar-saffron/20">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-sagar-saffron">
                      <path d={item.icon} />
                    </svg>
                  </span>
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-sagar-rose/90">
                    {item.fear}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-serif font-semibold leading-tight text-sagar-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-sagar-ink/80">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
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

      <section className="mt-6 grid gap-6 rounded-3xl border-2 border-sagar-amber/25 bg-gradient-to-br from-white via-sagar-cream/40 to-sagar-sand/50 p-6 shadow-sagar-soft md:grid-cols-2 md:p-8">
        <div>
          <h2 className="text-2xl font-serif text-sagar-ink md:text-3xl">What you receive every Saturday</h2>
          <p className="mt-2 text-sm text-sagar-ink/75">Everything you need—no hassle, no extra steps.</p>
          <ul className="mt-4 space-y-3">
            {deliverables.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sagar-saffron/25">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-sagar-saffron">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-sagar-ink/88">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border-2 border-sagar-rose/25 bg-gradient-to-br from-sagar-cream/80 to-white p-5">
          <h2 className="text-2xl font-serif text-sagar-ink md:text-3xl">Who this is for</h2>
          <p className="mt-2 text-sm font-medium text-sagar-rose/90">If this sounds like you—you&apos;re in the right place.</p>
          <ul className="mt-4 space-y-3">
            {whoItsFor.map((item) => (
              <li
                key={item.text}
                className={`flex items-start gap-3 rounded-xl px-3 py-2 ${
                  item.fear ? "border border-sagar-rose/30 bg-sagar-rose/5" : "bg-white/60"
                }`}
              >
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.fear ? "bg-sagar-rose/20" : "bg-sagar-amber/20"}`}>
                  <span className={`text-xs font-bold ${item.fear ? "text-sagar-rose" : "text-sagar-amber"}`}>✓</span>
                </span>
                <span className="text-sm font-medium text-sagar-ink/90">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TODO: Replace sample reviews with real user reviews from DB/CMS before scaling paid traffic. */}
      <section ref={reviewsRef} className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif text-sagar-ink">It really worked for them</h2>
            <p className="mt-2 text-base font-medium text-sagar-ink/85">Life change stories from members who got through their difficult phase.</p>
            <p className="mt-1 text-sm text-sagar-ink/75">Join devotees from London, Mumbai, Toronto, Dubai, and more.</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-xl text-sagar-gold" aria-hidden>★</span>
            ))}
            <span className="ml-2 text-sm font-semibold text-sagar-ink">5.0</span>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={`${t.name}-${t.location}`}
              className="group overflow-hidden rounded-2xl border-2 border-sagar-amber/25 bg-white shadow-sagar-soft transition hover:border-sagar-saffron/40 hover:shadow-sagar-card"
            >
              <div className="border-b border-sagar-amber/20 bg-sagar-cream/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sagar-ink">{t.name} · {t.location}</p>
                  <span className="flex gap-0.5 text-sagar-gold" aria-hidden>
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="rounded-lg bg-sagar-rose/5 border border-sagar-rose/20 px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-sagar-rose/80">Before</p>
                  <p className="mt-1 text-sm font-medium text-sagar-ink/90">{t.before}</p>
                </div>
                <div className="mt-3 rounded-lg bg-sagar-saffron/10 border border-sagar-saffron/25 px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-sagar-saffron">After · It worked</p>
                  <p className="mt-1 text-sm font-medium text-sagar-ink">{t.after}</p>
                </div>
                <p className="mt-3 text-xs text-sagar-ink/70">{t.detail}</p>
              </div>
            </article>
          ))}
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
              Add your name and gotra now. Membership includes weekly inclusion, live access, replay, and certificate.
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
            Add name and gotra now
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
          Add my name and gotra before cutoff
        </Link>
        <p className="text-sm text-sagar-ink/75">Don&apos;t let another Saturday pass without your name and gotra in the ritual.</p>
      </div>

      <MobileStickyCTA
        targetId="shani-weekly-hero"
        label="Add name and gotra"
        priceLabel={`${shaniHeading} Puja: ${monthlyPrice} / month`}
        onClick={() => {
          trackEvent("shani_weekly_cta_click", { placement: "sticky" });
          window.location.href = joinHref;
        }}
      />
    </div>
  );
}
