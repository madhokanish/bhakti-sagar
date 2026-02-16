"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

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
      className="sticky top-0 z-50 border-b border-sagar-amber/20 bg-sagar-cream/95 px-4 pb-2 pt-[calc(0.4rem+env(safe-area-inset-top))] text-xs text-sagar-ink/80 backdrop-blur"
    >
      <div className="container flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-sagar-ink/80">
          Seva Membership is coming. Premium content will be for members soon. Subscribe now.
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/subscribe"
            className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-sagar-saffron/40 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sagar-ember"
          >
            Subscribe
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
