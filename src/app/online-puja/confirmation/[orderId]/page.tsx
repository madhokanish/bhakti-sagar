import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import {
  formatPujaAmount,
  formatPujaPrice,
  getOnlinePujaBySlug,
  getNextPujaOccurrence
} from "@/lib/onlinePuja";
import PujaConfirmationTracker from "@/components/online-puja/PujaConfirmationTracker";

export const metadata: Metadata = buildMetadata({
  title: "Online Puja Confirmation",
  description: "Your online puja booking confirmation with schedule and next steps.",
  pathname: "/online-puja/confirmation"
});

function formatInTz(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz
  }).format(date);
}

export default function OnlinePujaConfirmationPage({
  params,
  searchParams
}: {
  params: { orderId: string };
  searchParams: { slug?: string; mode?: string; tz?: string; cur?: string; amt?: string; orig?: string };
}) {
  const puja = searchParams.slug ? getOnlinePujaBySlug(searchParams.slug) : undefined;
  const mode = searchParams.mode || "requested";
  const userTz = searchParams.tz || "UTC";
  const supportEmail = puja?.booking.supportEmail || "support@bhakti-sagar.com";
  const currency = searchParams.cur || puja?.booking.currency || "INR";
  const amount = Number(searchParams.amt || "");
  const originalAmount = Number(searchParams.orig || "");
  const resolvedAmount = Number.isFinite(amount) && amount > 0 ? amount : puja?.booking.priceAmount ?? null;
  const resolvedOriginalAmount =
    Number.isFinite(originalAmount) && resolvedAmount !== null && originalAmount > resolvedAmount
      ? originalAmount
      : undefined;
  const nextOccurrence = puja
    ? getNextPujaOccurrence({
        weeklyDay: puja.weeklyDay,
        startTime: puja.startTime,
        timeZone: puja.timezone
      })
    : null;

  return (
    <div className="container py-6 md:py-10">
      <PujaConfirmationTracker orderId={params.orderId} mode={mode} />
      <section className="mx-auto max-w-3xl rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft md:p-8">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">Confirmation</p>
        <h1 className="mt-2 text-3xl text-sagar-ink md:text-4xl">
          {mode === "paid" ? "Booking confirmed" : "Request received"}
        </h1>
        <p className="mt-2 text-sm text-sagar-ink/72">
          {mode === "paid"
            ? "Your seva booking is confirmed. You will receive an email shortly with all details."
            : "We have received your request. Our team will confirm the next slot by email."}
        </p>

        <div className="mt-5 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-4 text-sm text-sagar-ink/80">
          <p>
            <span className="font-semibold">Booking ID:</span> {params.orderId}
          </p>
          {puja && (
            <>
              <p className="mt-1">
                <span className="font-semibold">Seva:</span> {puja.title}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Amount:</span>{" "}
                {resolvedAmount !== null
                  ? formatPujaAmount({ amount: resolvedAmount, currency, locale: "en-IN" })
                  : formatPujaPrice(puja.booking)}
                {resolvedOriginalAmount ? (
                  <span className="ml-2 text-xs text-sagar-ink/55 line-through">
                    {formatPujaAmount({
                      amount: resolvedOriginalAmount,
                      currency,
                      locale: "en-IN"
                    })}
                  </span>
                ) : null}
              </p>
              {nextOccurrence && (
                <>
                  <p className="mt-1">
                    <span className="font-semibold">Your timezone:</span> {formatInTz(nextOccurrence, userTz)}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">IST:</span> {formatInTz(nextOccurrence, "Asia/Kolkata")}
                  </p>
                </>
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-sm text-sagar-ink/72">
          Next steps: keep an eye on your email for participation confirmation and support guidance.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/online-puja"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white"
          >
            Book another Seva
          </Link>
          {puja ? (
            <a
              href={`/api/online-puja/calendar?slug=${encodeURIComponent(puja.slug)}&orderId=${encodeURIComponent(
                params.orderId
              )}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/30 px-6 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-sagar-ink/75"
            >
              Add to calendar
            </a>
          ) : null}
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/30 px-6 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-sagar-ink/75"
          >
            Contact support
          </a>
        </div>
      </section>
    </div>
  );
}
