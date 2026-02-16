"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { OnlinePuja } from "@/lib/onlinePuja";
import { detectUserCurrency, formatPujaAmount, getPujaOfferPrice } from "@/lib/onlinePuja";
import OnlinePujaLayout from "@/components/online-puja/OnlinePujaLayout";
import PujaCountdownCard from "@/components/online-puja/PujaCountdownCard";
import { trackEvent } from "@/lib/analytics";

type Props = {
  pujas: OnlinePuja[];
};

export default function PujaListingPage({ pujas }: Props) {
  const [userLocale, setUserLocale] = useState("en-IN");
  const [userCurrency, setUserCurrency] = useState("INR");

  useEffect(() => {
    trackEvent("online_puja_list_view", { page: "/online-puja" });
  }, []);

  useEffect(() => {
    const locale = navigator.language || "en-IN";
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setUserLocale(locale);
    setUserCurrency(
      detectUserCurrency({
        locale,
        timeZone,
        fallback: "INR"
      })
    );
  }, []);

  return (
    <OnlinePujaLayout
      eyebrow="Online Puja"
      title="Book weekly temple seva from home"
      description="Choose a puja, review date and pricing, and complete your booking in a calm 2-step flow. Need help is always available."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {pujas.map((puja) => {
          const price = getPujaOfferPrice({ booking: puja.booking, currency: userCurrency });
          const card = (
            <>
              <div className="relative aspect-[4/3]">
                <Image src={puja.heroImageUrl} alt={puja.heroImageAlt} fill className="object-cover" sizes="100vw" />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-sagar-rose">{puja.deity} Puja</p>
                  <h2 className="mt-2 text-2xl font-serif text-sagar-ink">{puja.title}</h2>
                  <p className="mt-2 text-sm text-sagar-ink/70">{puja.tagline}</p>
                  {puja.isActive && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-sagar-ink">
                        {formatPujaAmount({
                          amount: price.currentAmount,
                          currency: price.currency,
                          locale: userLocale
                        })}
                        {price.isDiscounted ? (
                          <span className="ml-2 text-xs font-medium text-sagar-ink/50 line-through">
                            {formatPujaAmount({
                              amount: price.originalAmount,
                              currency: price.currency,
                              locale: userLocale
                            })}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-emerald-700">Limited offer • per seva</p>
                    </div>
                  )}
                </div>

                {puja.isActive ? (
                  <PujaCountdownCard weeklyDay={puja.weeklyDay} startTime={puja.startTime} timeZone={puja.timezone} compact />
                ) : (
                  <div className="rounded-2xl border border-sagar-amber/25 bg-sagar-sand/60 p-4 text-sm text-sagar-ink/75">
                    Launching soon. A new weekly seva slot will be announced soon.
                  </div>
                )}

                {puja.isActive ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-ember/80">
                    Open details
                  </p>
                ) : (
                  <span className="inline-flex rounded-full border border-sagar-amber/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/55">
                    Coming Soon
                  </span>
                )}
              </div>
            </>
          );

          if (puja.isActive) {
            return (
              <Link
                key={puja.slug}
                href={`/online-puja/${puja.slug}`}
                onClick={() =>
                  trackEvent("online_puja_card_click", { seva_id: puja.id, slug: puja.slug, target: "detail" })
                }
                className="group overflow-hidden rounded-3xl border border-sagar-amber/20 bg-white shadow-sagar-soft transition hover:-translate-y-0.5 hover:border-sagar-saffron/40 hover:shadow-sagar-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron/60"
              >
                {card}
              </Link>
            );
          }

          return (
            <article
              key={puja.slug}
              className="overflow-hidden rounded-3xl border border-sagar-amber/20 bg-white shadow-sagar-soft"
            >
              {card}
            </article>
          );
        })}
      </div>
    </OnlinePujaLayout>
  );
}
