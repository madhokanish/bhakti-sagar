"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { WEEKLY_PLANS } from "@/app/online-puja/plans";
import { trackEvent } from "@/lib/analytics";
import FAQAccordion from "@/components/online-puja/FAQAccordion";

type Props = {
  supportEmail: string;
};

const faqItems = [
  {
    id: "name-in-sankalp",
    question: "What does in your name mean?",
    answer: "Your name is included in sankalp recitation during the weekly ritual."
  },
  {
    id: "need-live",
    question: "Do I need to attend live?",
    answer: "No. Replay is available if you miss the live timing."
  },
  {
    id: "receive-after-puja",
    question: "What do I receive after each puja?",
    answer: "You receive confirmation updates, replay access, and a certificate PDF."
  },
  {
    id: "cancel-anytime",
    question: "Can I cancel anytime?",
    answer: "Yes. Membership can be managed and cancelled from billing settings."
  },
  {
    id: "outside-india",
    question: "Can I join from outside India?",
    answer: "Yes. Membership works globally and session timing is shown in your local timezone."
  },
  {
    id: "reminders",
    question: "How do reminders work?",
    answer: "You receive email reminders before the weekly puja schedule."
  }
];

export default function PujaListingPage({ supportEmail }: Props) {
  useEffect(() => {
    trackEvent("online_puja_view", { page: "/online-puja" });
  }, []);

  return (
    <div className="container pb-16 pt-6 md:pt-10">
      <section className="rounded-[2rem] border border-sagar-amber/25 bg-gradient-to-br from-white via-sagar-cream/60 to-sagar-sand/65 p-6 shadow-sagar-soft md:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Online Puja</p>
        <h1 className="mt-2 text-4xl font-serif leading-tight text-sagar-ink md:text-5xl">Weekly Puja Membership</h1>
        <p className="mt-3 max-w-3xl text-base text-sagar-ink/75 md:text-lg">
          4 pujas per month in your name. Live from temple. Replay and certificate. Cancel anytime.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {WEEKLY_PLANS.map((plan) => {
          const weekday = plan.dayOfWeek === 3 ? "Wednesday" : "Saturday";
          return (
            <Link
              key={plan.id}
              href={`/online-puja/${plan.slug}`}
              className="group overflow-hidden rounded-3xl border border-sagar-amber/25 bg-white shadow-sagar-soft transition hover:-translate-y-0.5 hover:border-sagar-saffron/45 hover:shadow-sagar-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
              onClick={() => trackEvent("directory_weekly_puja_click", { plan: plan.id })}
            >
              <div className="relative aspect-[16/9]">
                <Image
                  src={plan.heroImage}
                  alt={`${plan.deity} weekly membership`}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="space-y-3 p-5">
                <h2 className="text-2xl font-serif text-sagar-ink">{plan.id === "ganesh" ? "Ganesh Weekly" : "Shani Weekly"}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-sagar-amber/30 bg-sagar-cream/45 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-sagar-ink/80">
                    Every {weekday}
                  </span>
                  <span className="rounded-full border border-sagar-amber/30 bg-sagar-cream/45 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-sagar-ink/80">
                    4 pujas per month
                  </span>
                </div>

                <ul className="space-y-1 text-sm text-sagar-ink/78">
                  <li>• Name in sankalp weekly</li>
                  <li>• Live access</li>
                  <li>• Replay + certificate</li>
                </ul>
                <p className="text-sm font-semibold text-sagar-ember">
                  {plan.id === "ganesh" ? "Open Ganesh page" : "Open Shani page"} <span aria-hidden="true">→</span>
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 grid gap-3 rounded-3xl border border-sagar-amber/20 bg-sagar-cream/35 p-4 text-center text-sm text-sagar-ink/82 md:grid-cols-3">
        <div className="rounded-2xl border border-sagar-amber/20 bg-white/90 p-3">Weekly ritual handled for you</div>
        <div className="rounded-2xl border border-sagar-amber/20 bg-white/90 p-3">Name included automatically every week</div>
        <div className="rounded-2xl border border-sagar-amber/20 bg-white/90 p-3">Replay and certificate after each puja</div>
      </section>

      {/* Placeholder reviews: replace with verified user testimonials. */}
      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
          <p className="text-sm font-semibold text-sagar-ink">Rohan M. · London <span className="text-sagar-gold">★★★★★</span></p>
          <p className="mt-2 text-sm text-sagar-ink/75">The weekly structure helps me stay consistent even during work travel.</p>
        </article>
        <article className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
          <p className="text-sm font-semibold text-sagar-ink">Vandana R. · Mumbai <span className="text-sagar-gold">★★★★★</span></p>
          <p className="mt-2 text-sm text-sagar-ink/75">Replay and certificate updates are clear and easy to follow.</p>
        </article>
        <article className="rounded-2xl border border-sagar-amber/20 bg-white p-4 shadow-sagar-soft">
          <p className="text-sm font-semibold text-sagar-ink">Arjun P. · Toronto <span className="text-sagar-gold">★★★★★</span></p>
          <p className="mt-2 text-sm text-sagar-ink/75">A practical way to stay connected from outside India.</p>
        </article>
      </section>

      <div className="mt-8">
        <FAQAccordion items={faqItems} title="Membership FAQs" sectionId="online-puja-faq" />
      </div>

      <p className="mt-6 text-xs text-sagar-ink/58">
        Support: <a href={`mailto:${supportEmail}`} className="underline underline-offset-2">{supportEmail}</a>
      </p>
    </div>
  );
}
