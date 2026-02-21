"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { DEITY_NAMES } from "@/lib/terminology";

const DISMISS_KEY = "bs_promo_ribbon_dismissed_at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Paywall promo cleanup audit:
// - src/app/page.tsx (hero + today + featured puja CTAs)
// - src/components/online-puja/PujaListingPage.tsx (card CTA + premium text)
// - src/components/online-puja/PujaDetailPage.tsx (mobile CTA + gate copy)
// - src/components/LiveDarshanGrid.tsx (card CTA)
// - src/components/PremiumFeatureGate.tsx (removed promo copy + pricing line)
export default function PromoRibbon() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(DISMISS_KEY) : null;
    if (stored) {
      const timestamp = Number(stored);
      if (!Number.isNaN(timestamp) && Date.now() - timestamp < DISMISS_TTL_MS) {
        setVisible(false);
        return;
      }
    }
    setVisible(true);
  }, []);

  useLayoutEffect(() => {
    const update = () => {
      const height = visible ? ref.current?.offsetHeight ?? 0 : 0;
      document.documentElement.style.setProperty("--promo-ribbon-height", `${height}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      document.documentElement.style.setProperty("--promo-ribbon-height", "0px");
    }
  }, [visible]);

  if (!visible) return null;

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div
      ref={ref}
      className="global-ribbon sticky top-0 z-50 border-b border-sagar-amber/20 bg-sagar-cream/95 px-4 py-[calc(0.35rem+env(safe-area-inset-top)/2)] text-xs text-sagar-ink/80 backdrop-blur"
    >
      <div className="container flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-sagar-ink">
            Weekly Puja Membership
          </p>
          <p className="hidden text-xs text-sagar-ink/75 sm:block">
            Weekly Puja Membership now at lower prices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/online-puja"
            aria-label="View Weekly Puja Membership plans"
            onClick={() => trackEvent("home_ribbon_weekly_puja_click", { target: "online_puja" })}
            className="inline-flex min-h-[30px] items-center justify-center rounded-full border border-sagar-saffron/40 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sagar-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
          >
            View plans
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-sagar-amber/30 text-xs text-sagar-ink/70"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
