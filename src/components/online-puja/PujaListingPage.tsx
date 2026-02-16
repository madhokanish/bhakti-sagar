"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { OnlinePuja } from "@/lib/onlinePuja";
import type { SupportedCurrency } from "@/lib/subscription";
import {
  WEEKLY_PLANS,
  formatCurrency,
  getPlanById,
  normalizeMode,
  type MembershipMode,
  type WeeklyPlan
} from "@/app/online-puja/plans";
import { trackEvent } from "@/lib/analytics";
import BenefitTiles from "@/components/online-puja/BenefitTiles";
import FAQAccordion from "@/components/online-puja/FAQAccordion";
import HowItWorksSteps from "@/components/online-puja/HowItWorksSteps";
import MembershipModeToggle from "@/components/online-puja/MembershipModeToggle";
import MobileStickyCTA from "@/components/online-puja/MobileStickyCTA";
import PlanIntentModal, { type PlanIntentPayload } from "@/components/online-puja/PlanIntentModal";
import TestimonialsStrip from "@/components/online-puja/TestimonialsStrip";
import WeeklyPlanCard from "@/components/online-puja/WeeklyPlanCard";

type Props = {
  initialCurrency: SupportedCurrency;
  secondaryPujas: OnlinePuja[];
  supportEmail: string;
};

const faqItems = [
  {
    id: "name-in-sankalp",
    question: "What does 'in your name' mean?",
    answer:
      "Your name is included in the sankalp recitation during the ritual. This is a traditional devotional inclusion, not a guaranteed outcome."
  },
  {
    id: "miss-live",
    question: "What if I miss the live puja?",
    answer: "Replay access is included, so you can watch later when your schedule allows."
  },
  {
    id: "cancel-anytime",
    question: "Can I cancel anytime?",
    answer: "Yes. Membership can be managed and cancelled from billing settings."
  },
  {
    id: "reminders",
    question: "How do reminders work?",
    answer: "You receive email reminders before each weekly seva. Optional WhatsApp updates can be enabled during signup."
  },
  {
    id: "gotra-required",
    question: "Do I need gotra?",
    answer: "Gotra is optional. If you do not know it, leave it blank."
  },
  {
    id: "outside-india",
    question: "Is this available outside India?",
    answer: "Yes. Devotees outside India can join; schedules are shown in your local timezone with IST reference."
  }
];

function toSubscribeMode(mode: MembershipMode) {
  return mode === "membership" ? "monthly" : "once";
}

function serializeIntent(
  plan: WeeklyPlan,
  mode: MembershipMode,
  payload: PlanIntentPayload,
  pathname: string
) {
  const params = new URLSearchParams();
  params.set("plan", plan.id);
  params.set("mode", toSubscribeMode(mode));
  params.set("name", payload.fullName);
  if (payload.gotra) params.set("gotra", payload.gotra);
  if (payload.intention) params.set("intention", payload.intention);
  if (payload.whatsappOptIn) params.set("wa", "1");
  params.set("returnTo", pathname || "/online-puja");
  return params.toString();
}

export default function PujaListingPage({ initialCurrency, secondaryPujas, supportEmail }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState("en-GB");
  const [mode, setMode] = useState<MembershipMode>(normalizeMode(searchParams.get("mode")));
  const [selectedPlanId, setSelectedPlanId] = useState<"ganesh" | "shani">("ganesh");
  const [intentOpen, setIntentOpen] = useState(false);

  useEffect(() => {
    setLocale(navigator.language || "en-GB");
  }, []);

  useEffect(() => {
    setMode(normalizeMode(searchParams.get("mode")));
  }, [searchParams]);

  useEffect(() => {
    const lastVisit = window.localStorage.getItem("online_puja_last_visit_at");
    trackEvent("online_puja_page_view", {
      page: "/online-puja",
      return_visit: Boolean(lastVisit)
    });
    window.localStorage.setItem("online_puja_last_visit_at", new Date().toISOString());

    const milestones = [25, 50, 75];
    const fired = new Set<number>();
    const onScroll = () => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - doc.clientHeight;
      if (maxScroll <= 0) return;
      const depth = Math.round((window.scrollY / maxScroll) * 100);
      milestones.forEach((value) => {
        if (depth >= value && !fired.has(value)) {
          fired.add(value);
          trackEvent("online_puja_scroll_depth", { depth_percent: value });
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const selectedPlan = useMemo(() => getPlanById(selectedPlanId), [selectedPlanId]);
  const stickyPriceLabel = useMemo(() => {
    if (mode === "membership") {
      return `${selectedPlan.deity}: ${formatCurrency(selectedPlan.priceMonthly[initialCurrency], initialCurrency, locale)} / month`;
    }
    return `${selectedPlan.deity}: ${formatCurrency(selectedPlan.priceOnce[initialCurrency], initialCurrency, locale)} this week`;
  }, [selectedPlan, initialCurrency, locale, mode]);

  function updateMode(nextMode: MembershipMode) {
    if (mode === nextMode) return;
    setMode(nextMode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", nextMode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    trackEvent("online_puja_mode_toggle", { mode: nextMode });
  }

  function openIntent(plan: WeeklyPlan, source: "hero" | "card" | "sticky") {
    setSelectedPlanId(plan.id);
    setIntentOpen(true);
    trackEvent("online_puja_cta_click", {
      action: mode === "membership" ? "join" : "book_once",
      plan: plan.id,
      source
    });
  }

  function onIntentContinue(payload: PlanIntentPayload) {
    trackEvent("online_puja_intent_submit", {
      plan: selectedPlan.id,
      mode,
      intention: payload.intention,
      whatsapp_opt_in: payload.whatsappOptIn
    });
    setIntentOpen(false);
    router.push(`/subscribe?${serializeIntent(selectedPlan, mode, payload, pathname || "/online-puja")}`);
  }

  return (
    <div className="container pb-24 pt-6 md:pt-10">
      <section
        id="online-puja-hero"
        className="rounded-[2rem] border border-sagar-amber/25 bg-gradient-to-br from-white via-sagar-cream/60 to-sagar-sand/65 p-6 shadow-sagar-soft md:p-9"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Online Puja</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-serif leading-tight text-sagar-ink md:text-5xl">Weekly Puja Membership</h1>
        <p className="mt-3 max-w-3xl text-base text-sagar-ink/75 md:text-lg">
          Your name included every week. Live from temple. Replay included. Cancel anytime.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              updateMode("membership");
              openIntent(getPlanById(selectedPlanId), "hero");
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sagar-ember"
          >
            Start membership
          </button>
          <button
            type="button"
            onClick={() => {
              updateMode("once");
              openIntent(getPlanById(selectedPlanId), "hero");
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/35 bg-white px-6 py-2.5 text-sm font-semibold text-sagar-ink/80 hover:bg-sagar-cream/70"
          >
            Book once
          </button>
        </div>
        <p className="mt-4 text-sm text-sagar-ink/68">Temple seva from home, with clear deliverables every week.</p>
      </section>

      <div className="mt-4">
        <MembershipModeToggle mode={mode} onChange={updateMode} sticky />
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {WEEKLY_PLANS.map((plan) => (
          <WeeklyPlanCard
            key={plan.id}
            plan={plan}
            mode={mode}
            currency={initialCurrency}
            locale={locale}
            onCardClick={(selected) => {
              setSelectedPlanId(selected.id);
              trackEvent("online_puja_plan_click", { plan: selected.id, mode });
            }}
            onPrimaryClick={(selected) => openIntent(selected, "card")}
          />
        ))}
      </section>

      <BenefitTiles />
      <HowItWorksSteps />
      <TestimonialsStrip />

      <section className="mt-10" id="faq">
        <FAQAccordion items={faqItems} title="Membership FAQs" sectionId="faq" />
      </section>

      <section className="mt-10 rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft" id="more-weekly-pujas">
        <h2 className="text-2xl font-serif text-sagar-ink md:text-3xl">More weekly pujas</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {secondaryPujas.map((puja) => {
            const label = puja.deity === "Lakshmi" ? "Launching soon" : "Also available";
            return (
              <article key={puja.id} className="overflow-hidden rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45">
                <div className="relative aspect-[16/9]">
                  <Image src={puja.heroImageUrl} alt={puja.heroImageAlt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">{label}</p>
                  <h3 className="mt-1 text-lg font-serif text-sagar-ink">{puja.title}</h3>
                  <p className="mt-1 text-sm text-sagar-ink/70">{puja.tagline}</p>
                  <Link href={`/online-puja/${puja.slug}`} className="mt-3 inline-flex text-sm font-semibold text-sagar-ember hover:text-sagar-saffron">
                    See details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <p className="mt-6 text-xs text-sagar-ink/58">
        Support: <a href={`mailto:${supportEmail}`} className="underline underline-offset-2">{supportEmail}</a>
      </p>

      <PlanIntentModal
        open={intentOpen}
        mode={mode}
        planTitle={selectedPlan.title}
        onClose={() => setIntentOpen(false)}
        onContinue={onIntentContinue}
      />

      <MobileStickyCTA
        targetId="online-puja-hero"
        label={mode === "membership" ? "Join membership" : "Book once"}
        priceLabel={stickyPriceLabel}
        onClick={() => openIntent(selectedPlan, "sticky")}
      />
    </div>
  );
}
