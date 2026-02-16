"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SupportedCurrency } from "@/lib/subscription";
import { trackEvent } from "@/lib/analytics";
import { formatCurrency, getPlanById } from "@/app/online-puja/plans";

type Props = {
  initialPlan: "ganesh" | "shani";
  initialMode: "monthly" | "once";
  initialCurrency: SupportedCurrency;
  trialDays: number;
  prefill: {
    email?: string;
    fullName?: string;
    gotra?: string;
    intention?: string;
    whatsappOptIn?: boolean;
    returnTo?: string;
  };
};

export default function SubscribeCheckoutPanel({
  initialPlan,
  initialMode,
  initialCurrency,
  trialDays,
  prefill
}: Props) {
  const [email, setEmail] = useState(prefill.email || "");
  const [fullName, setFullName] = useState(prefill.fullName || "");
  const [gotra, setGotra] = useState(prefill.gotra || "");
  const [intention, setIntention] = useState(prefill.intention || "career");
  const [whatsappOptIn, setWhatsappOptIn] = useState(Boolean(prefill.whatsappOptIn));
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");
  const [portalError, setPortalError] = useState("");

  const plan = useMemo(() => getPlanById(initialPlan), [initialPlan]);
  const renewalLabel = useMemo(() => {
    const amount = initialMode === "monthly" ? plan.priceMonthly[initialCurrency] : plan.priceOnce[initialCurrency];
    const suffix = initialMode === "monthly" ? " / month" : " this week";
    return `${formatCurrency(amount, initialCurrency)}${suffix}`;
  }, [initialCurrency, initialMode, plan]);

  async function startCheckout() {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/online-puja-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan: plan.id,
          mode: initialMode,
          fullName,
          gotra,
          intention,
          whatsappOptIn,
          returnTo: prefill.returnTo || "/online-puja",
          currency: initialCurrency
        })
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to continue to checkout.");
      }

      trackEvent("checkout_start", { plan: plan.id, mode: initialMode });
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
    } catch (requestError) {
      setPortalError(requestError instanceof Error ? requestError.message : "Unable to open portal.");
      setPortalLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Weekly Puja Membership</p>
      <h1 className="mt-2 text-3xl font-serif text-sagar-ink md:text-4xl">
        {initialMode === "monthly" ? `Start ${plan.deity} membership` : `Book ${plan.deity} puja once`}
      </h1>
      <p className="mt-2 text-sm text-sagar-ink/72">{plan.subtitle}</p>

      <div className="mt-5 grid gap-4 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">Selected plan</p>
          <p className="mt-1 text-lg font-semibold text-sagar-ink">{plan.title}</p>
          <p className="mt-1 text-sm text-sagar-ink/70">{renewalLabel}</p>
          {initialMode === "monthly" ? (
            <p className="mt-1 text-xs text-sagar-ink/65">No charge today. Auto-renews after {trialDays} days. Cancel anytime.</p>
          ) : (
            <p className="mt-1 text-xs text-sagar-ink/65">Single seva booking. No recurring charge.</p>
          )}
        </div>
        <ul className="space-y-1 text-sm text-sagar-ink/75">
          {plan.includes.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block text-sm text-sagar-ink/80">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-sagar-amber/30 px-3 py-2 outline-none focus:border-sagar-saffron"
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="block text-sm text-sagar-ink/80">
          Full name
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-sagar-amber/30 px-3 py-2 outline-none focus:border-sagar-saffron"
            placeholder="Your full name"
            required
          />
        </label>
        <label className="block text-sm text-sagar-ink/80">
          Gotra (optional)
          <input
            type="text"
            value={gotra}
            onChange={(event) => setGotra(event.target.value)}
            className="mt-1 w-full rounded-xl border border-sagar-amber/30 px-3 py-2 outline-none focus:border-sagar-saffron"
            placeholder="Don't know? Leave blank"
          />
        </label>
        <label className="block text-sm text-sagar-ink/80">
          Intention
          <select
            value={intention}
            onChange={(event) => setIntention(event.target.value)}
            className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 outline-none focus:border-sagar-saffron"
          >
            <option value="career">Career</option>
            <option value="studies">Studies</option>
            <option value="health">Health</option>
            <option value="family_peace">Family peace</option>
            <option value="protection">Protection</option>
            <option value="stability">Stability</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-sagar-ink/72">
        <input
          type="checkbox"
          checked={whatsappOptIn}
          onChange={(event) => setWhatsappOptIn(event.target.checked)}
          className="h-4 w-4 rounded border-sagar-amber/50 text-sagar-saffron focus:ring-sagar-saffron"
        />
        Send me WhatsApp reminders and updates
      </label>

      {error ? <p className="mt-3 text-sm text-sagar-rose">{error}</p> : null}
      {portalError ? <p className="mt-3 text-sm text-sagar-rose">{portalError}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Redirecting..."
            : initialMode === "monthly"
            ? `Start ${trialDays}-day trial`
            : "Proceed to payment"}
        </button>
        <button
          type="button"
          onClick={openPortal}
          disabled={portalLoading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/30 px-6 py-2 text-sm font-semibold text-sagar-ink/75"
        >
          {portalLoading ? "Opening..." : "Manage subscription"}
        </button>
      </div>

      <p className="mt-4 text-xs text-sagar-ink/60">
        By continuing, you agree to our <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
        <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </section>
  );
}
