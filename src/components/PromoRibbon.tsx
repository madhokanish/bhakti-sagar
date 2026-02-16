"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import PaywallTrigger from "@/components/PaywallTrigger";

const DISMISS_KEY = "bs_promo_ribbon_dismissed_at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Paywall promo cleanup audit:
// - src/app/page.tsx (hero + today + featured puja CTAs)
// - src/components/online-puja/PujaListingPage.tsx (card CTA + premium text)
// - src/components/online-puja/PujaDetailPage.tsx (mobile CTA + gate copy)
// - src/components/LiveDarshanGrid.tsx (card CTA)
// - src/components/PremiumFeatureGate.tsx (removed promo copy + pricing line)
export default function PromoRibbon({ priceLabel }: { priceLabel: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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

  useEffect(() => {
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
      className="sticky top-0 z-50 border-b border-sagar-amber/20 bg-sagar-cream/90 px-4 py-2 text-xs text-sagar-ink/80 backdrop-blur"
    >
      <div className="container flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-sagar-ink/80">
          14 day free trial. Then {priceLabel}/month in your currency. Cancel anytime.
        </p>
        <div className="flex items-center gap-2">
          <PaywallTrigger
            featureName="promo_ribbon"
            returnTo={pathname || "/"}
            priceLabel={priceLabel}
            className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-sagar-saffron/40 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sagar-ember"
          >
            View plans
          </PaywallTrigger>
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
