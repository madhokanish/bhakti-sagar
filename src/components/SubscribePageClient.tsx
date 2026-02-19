"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  currency: "GBP" | "USD" | "EUR";
};

const PRICE_BY_CURRENCY = {
  GBP: 3.99,
  USD: 4.99,
  EUR: 4.99
} as const;

function formatPrice(currency: "GBP" | "USD" | "EUR") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(PRICE_BY_CURRENCY[currency]);
}

export default function SubscribePageClient({ currency }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");
  const [portalError, setPortalError] = useState("");
  const priceLabel = useMemo(() => formatPrice(currency), [currency]);

  async function startMembershipCheckout() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          returnUrl: "/online-puja",
          currency
        })
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }
      trackEvent("checkout_start", { source: "subscribe_page", currency });
      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to continue.");
      setLoading(false);
    }
  }

  async function openPortal() {
    if (portalLoading) return;
    setPortalLoading(true);
    setPortalError("");
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to open billing portal.");
      }
      trackEvent("portal_opened", { source: "subscribe_page" });
      window.location.href = data.url;
    } catch (portalRequestError) {
      setPortalError(portalRequestError instanceof Error ? portalRequestError.message : "Unable to open portal.");
      setPortalLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Membership</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink md:text-5xl">Start your membership</h1>
      <p className="mt-3 text-base text-sagar-ink/75">
        Access Live Darshan and Online Puja booking with one membership.
      </p>

      <div className="mt-4 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
        <p className="text-lg font-semibold text-sagar-ink">{priceLabel} per month</p>
        <ul className="mt-2 space-y-1 text-sm text-sagar-ink/78">
          <li>• Secure checkout</li>
          <li>• Auto renews monthly</li>
          <li>• Cancel anytime from billing settings</li>
        </ul>
      </div>

      <label className="mt-4 block text-sm text-sagar-ink/80">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 outline-none focus:border-sagar-saffron"
        />
      </label>

      {error ? <p className="mt-2 text-sm text-sagar-rose">{error}</p> : null}
      {portalError ? <p className="mt-2 text-sm text-sagar-rose">{portalError}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startMembershipCheckout}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Redirecting..." : "Proceed to checkout"}
        </button>
        <button
          type="button"
          onClick={openPortal}
          disabled={portalLoading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/30 px-6 py-2 text-sm font-semibold text-sagar-ink/75 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {portalLoading ? "Opening..." : "Manage subscription"}
        </button>
      </div>

      <p className="mt-4 text-xs text-sagar-ink/65">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </section>
  );
}
