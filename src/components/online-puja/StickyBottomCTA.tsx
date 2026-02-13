"use client";

import { useEffect, useMemo, useState } from "react";
import { trackEvent, type EventParams } from "@/lib/analytics";
import {
  detectUserCurrency,
  formatPujaAmount,
  getPujaOfferPrice,
  type PujaBookingPrice
} from "@/lib/onlinePuja";

type Props = {
  href: string;
  label: string;
  metaSuffix?: string;
  booking?: PujaBookingPrice;
  eventName?: string;
  eventParams?: EventParams;
};

export default function StickyBottomCTA({ href, label, metaSuffix, booking, eventName, eventParams }: Props) {
  const [userLocale, setUserLocale] = useState("en-IN");
  const [userCurrency, setUserCurrency] = useState(booking?.currency || "INR");

  useEffect(() => {
    if (!booking) return;
    const locale = navigator.language || "en-IN";
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setUserLocale(locale);
    setUserCurrency(
      detectUserCurrency({
        locale,
        timeZone,
        fallback: booking.currency
      })
    );
  }, [booking]);

  const offerPrice = useMemo(() => {
    if (!booking) return null;
    return getPujaOfferPrice({ booking, currency: userCurrency });
  }, [booking, userCurrency]);

  return (
    <div className="fixed inset-x-0 bottom-3 z-30 px-4 md:hidden">
      <a
        href={href}
        onClick={() => {
          if (eventName) {
            trackEvent(eventName, eventParams);
          }
        }}
        className="block rounded-2xl bg-sagar-saffron px-5 py-2.5 text-center text-white shadow-sagar-soft"
      >
        <span className="block text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
        {offerPrice ? (
          <span className="mt-1 block text-[0.72rem] text-white/95">
            {formatPujaAmount({
              amount: offerPrice.currentAmount,
              currency: offerPrice.currency,
              locale: userLocale
            })}
            {offerPrice.isDiscounted ? (
              <span className="ml-1 text-white/80 line-through">
                {formatPujaAmount({
                  amount: offerPrice.originalAmount,
                  currency: offerPrice.currency,
                  locale: userLocale
                })}
              </span>
            ) : null}
          </span>
        ) : null}
        {metaSuffix ? <span className="mt-1 block text-[0.68rem] text-white/90">{metaSuffix}</span> : null}
      </a>
    </div>
  );
}
