"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { WeeklyPlan } from "@/app/online-puja/plans";
import { trackEvent } from "@/lib/analytics";

type Props = {
  plans: WeeklyPlan[];
};

export default function HomeWeeklyMembershipSection({ plans }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        trackEvent("home_online_puja_section_view", { section: "weekly_membership" });
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="mt-6 rounded-3xl border border-sagar-amber/25 bg-white/85 p-4 shadow-sagar-soft md:p-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Online Puja</p>
        <h2 className="mt-1 text-3xl font-serif text-sagar-ink md:text-4xl">Weekly Puja Membership</h2>
        <p className="mt-2 text-sm text-sagar-ink/75 md:text-base">
          4 pujas every month in your name. Live from temple. Replay and certificate. Cancel anytime.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const weekday = plan.dayOfWeek === 3 ? "Wednesday" : "Saturday";

          return (
            <article
              key={plan.id}
              className="overflow-hidden rounded-2xl border border-sagar-amber/25 bg-white shadow-sagar-card"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={plan.heroImage}
                  alt={`${plan.deity} weekly membership`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 space-y-2">
                  <h3 className="text-2xl font-serif leading-tight text-white">{plan.deity} Weekly Membership</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/30 bg-black/25 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white">
                      Every {weekday}
                    </span>
                    <span className="rounded-full border border-white/30 bg-black/25 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white">
                      4 pujas per month
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <ul className="space-y-1 text-sm text-sagar-ink/78">
                  <li>• Name in sankalp weekly</li>
                  <li>• Live access</li>
                  <li>• Replay + certificate</li>
                </ul>

                <Link
                  href={`/online-puja/${plan.slug}`}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-full bg-sagar-saffron px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sagar-ember"
                  onClick={() => trackEvent("home_weekly_puja_click", { plan: plan.id })}
                >
                  {plan.id === "ganesh" ? "Open Ganesh page" : "Open Shani page"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/35 p-3 text-center text-sm text-sagar-ink/82 md:grid-cols-3">
        <div className="rounded-xl border border-sagar-amber/20 bg-white/85 p-3">Weekly ritual handled for you</div>
        <div className="rounded-xl border border-sagar-amber/20 bg-white/85 p-3">Name included automatically every week</div>
        <div className="rounded-xl border border-sagar-amber/20 bg-white/85 p-3">Replay and certificate after each puja</div>
      </div>

      {/* Placeholder reviews: replace with verified testimonials from production data source. */}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <p className="text-sm font-semibold text-sagar-ink">Rohan M. · London <span className="text-sagar-gold">★★★★★</span></p>
          <p className="mt-2 text-sm text-sagar-ink/75">The weekly rhythm helps me stay consistent even with travel and work.</p>
        </article>
        <article className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <p className="text-sm font-semibold text-sagar-ink">Vandana R. · Mumbai <span className="text-sagar-gold">★★★★★</span></p>
          <p className="mt-2 text-sm text-sagar-ink/75">Clear updates and replay links make it practical when I miss the live timing.</p>
        </article>
        <article className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <p className="text-sm font-semibold text-sagar-ink">Arjun P. · Toronto <span className="text-sagar-gold">★★★★★</span></p>
          <p className="mt-2 text-sm text-sagar-ink/75">It gives me a steady Saturday ritual while living outside India.</p>
        </article>
      </div>
    </section>
  );
}
