"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPlanSchedule, type WeeklyPlan } from "@/app/online-puja/plans";
import { trackEvent } from "@/lib/analytics";

type Props = {
  targetId: string;
  plans: WeeklyPlan[];
};

export default function HomeStickyMembershipCTA({ targetId, plans }: Props) {
  const [visible, setVisible] = useState(false);

  const nextPlan = useMemo(() => {
    const sorted = [...plans]
      .map((plan) => ({ plan, schedule: getPlanSchedule(plan) }))
      .sort((a, b) => a.schedule.nextOccurrence.getTime() - b.schedule.nextOccurrence.getTime());

    return sorted[0]?.plan;
  }, [plans]);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  if (!visible || !nextPlan) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-30 border-t border-sagar-amber/30 bg-white/98 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sagar-rose">Join Weekly Puja Membership</p>
          <p className="text-sm font-semibold text-sagar-ink">
            Next session: {nextPlan.deity} ({nextPlan.dayOfWeek === 3 ? "Wed" : "Sat"})
          </p>
        </div>
        <Link
          href="/online-puja"
          className="inline-flex min-h-[42px] items-center justify-center rounded-full bg-sagar-saffron px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            trackEvent("home_sticky_cta_click", { plan: nextPlan.id });
            trackEvent("home_online_puja_cta_click", { placement: "sticky", plan: nextPlan.id });
          }}
        >
          Join
        </Link>
      </div>
    </div>
  );
}
