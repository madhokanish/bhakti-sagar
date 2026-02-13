"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  detectUserCurrency,
  formatPujaAmount,
  getNextPujaOccurrence,
  getPujaOfferPrice,
  type OnlinePuja
} from "@/lib/onlinePuja";
import { trackEvent } from "@/lib/analytics";

type Props = {
  puja: OnlinePuja;
};

type ContactState = {
  name: string;
  email: string;
  phoneOrWhatsapp: string;
};

type SankalpState = {
  intention: string;
  devoteeNames: string;
  notes: string;
};

const initialContact: ContactState = {
  name: "",
  email: "",
  phoneOrWhatsapp: ""
};

const initialSankalp: SankalpState = {
  intention: "General wellbeing",
  devoteeNames: "",
  notes: ""
};

const PREFILL_KEY = "bhakti_sagar_online_puja_prefill_v1";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function PujaCheckoutClient({ puja }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [contact, setContact] = useState<ContactState>(initialContact);
  const [sankalp, setSankalp] = useState<SankalpState>(initialSankalp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLocale, setUserLocale] = useState("en-IN");
  const [userCurrency, setUserCurrency] = useState(puja.booking.currency);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFILL_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ContactState>;
      if (!parsed || typeof parsed !== "object") return;
      setContact((prev) => ({
        ...prev,
        name: typeof parsed.name === "string" ? parsed.name : prev.name,
        email: typeof parsed.email === "string" ? parsed.email : prev.email,
        phoneOrWhatsapp:
          typeof parsed.phoneOrWhatsapp === "string" ? parsed.phoneOrWhatsapp : prev.phoneOrWhatsapp
      }));
    } catch {
      // Ignore malformed local cache.
    }
  }, []);

  useEffect(() => {
    const locale = navigator.language || "en-IN";
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setUserLocale(locale);
    setUserCurrency(
      detectUserCurrency({
        locale,
        timeZone,
        fallback: puja.booking.currency
      })
    );
  }, [puja.booking.currency]);

  useEffect(() => {
    trackEvent("checkout_start", { seva_id: puja.id });
  }, [puja.id]);

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const nextOccurrence = useMemo(
    () =>
      getNextPujaOccurrence({
        weeklyDay: puja.weeklyDay,
        startTime: puja.startTime,
        timeZone: puja.timezone
      }),
    [puja.startTime, puja.timezone, puja.weeklyDay]
  );
  const offerPrice = useMemo(
    () => getPujaOfferPrice({ booking: puja.booking, currency: userCurrency }),
    [puja.booking, userCurrency]
  );

  const localTime = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: localTz
  }).format(nextOccurrence);

  const istTime = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).format(nextOccurrence);

  const contactValid = contact.name.trim().length > 1 && validEmail(contact.email.trim());

  function goStepTwo() {
    if (!contactValid) return;
    trackEvent("checkout_contact_complete", { seva_id: puja.id });
    setStep(2);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      trackEvent("checkout_sankalp_complete", { seva_id: puja.id, intention: sankalp.intention });

      if (!puja.booking.isPaymentEnabled) {
        const additionalInfo = [
          `Intention: ${sankalp.intention}`,
          `Devotee names: ${sankalp.devoteeNames || "Not provided"}`,
          `Notes: ${sankalp.notes || "Not provided"}`
        ].join("\n");

        const response = await fetch("/api/online-puja-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pujaTitle: puja.title,
            pujaSlug: puja.slug,
            name: contact.name,
            email: contact.email,
            phone: contact.phoneOrWhatsapp,
            additionalInfo
          })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || "Unable to submit booking request right now.");
        }

        const fallbackOrderId = `REQ-${Date.now()}`;
        trackEvent("form_submit", { seva_id: puja.id, flow: "fallback" });
        window.localStorage.setItem(
          PREFILL_KEY,
          JSON.stringify({
            name: contact.name.trim(),
            email: contact.email.trim(),
            phoneOrWhatsapp: contact.phoneOrWhatsapp.trim()
          })
        );
        window.location.href = `/online-puja/confirmation/${fallbackOrderId}?slug=${encodeURIComponent(
          puja.slug
        )}&mode=requested&tz=${encodeURIComponent(localTz)}&cur=${encodeURIComponent(
          offerPrice.currency
        )}&amt=${encodeURIComponent(offerPrice.currentAmount)}&orig=${encodeURIComponent(
          offerPrice.originalAmount
        )}`;
        return;
      }

      trackEvent("payment_start", { seva_id: puja.id });
      const response = await fetch("/api/online-puja/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pujaSlug: puja.slug,
          name: contact.name,
          email: contact.email,
          phoneOrWhatsapp: contact.phoneOrWhatsapp,
          intention: sankalp.intention,
          devoteeNames: sankalp.devoteeNames,
          notes: sankalp.notes,
          timezoneUser: localTz
        })
      });

      const data = (await response.json()) as { error?: string; orderId?: string; checkoutUrl?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to start payment.");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.orderId) {
        trackEvent("payment_success", { order_id: data.orderId, amount: offerPrice.currentAmount });
        window.localStorage.setItem(
          PREFILL_KEY,
          JSON.stringify({
            name: contact.name.trim(),
            email: contact.email.trim(),
            phoneOrWhatsapp: contact.phoneOrWhatsapp.trim()
          })
        );
        window.location.href = `/online-puja/confirmation/${data.orderId}?slug=${encodeURIComponent(
          puja.slug
        )}&mode=paid&tz=${encodeURIComponent(localTz)}&cur=${encodeURIComponent(
          offerPrice.currency
        )}&amt=${encodeURIComponent(offerPrice.currentAmount)}&orig=${encodeURIComponent(
          offerPrice.originalAmount
        )}`;
      }
    } catch (submissionError) {
      trackEvent("payment_failure", { reason: submissionError instanceof Error ? submissionError.message : "unknown" });
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to continue right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">Online Puja Checkout</p>
      <h1 className="mt-2 text-3xl text-sagar-ink md:text-4xl">Book Seva</h1>
      <p className="mt-2 text-sm text-sagar-ink/70">{puja.title}</p>

      <div className="mt-4 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/55 p-4 text-sm text-sagar-ink/80">
        <p>
          <span className="font-semibold">Amount:</span>{" "}
          {formatPujaAmount({
            amount: offerPrice.currentAmount,
            currency: offerPrice.currency,
            locale: userLocale
          })}
          {offerPrice.isDiscounted ? (
            <span className="ml-2 text-xs text-sagar-ink/55 line-through">
              {formatPujaAmount({
                amount: offerPrice.originalAmount,
                currency: offerPrice.currency,
                locale: userLocale
              })}
            </span>
          ) : null}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Your local time:</span> {localTime}
        </p>
        <p className="mt-1">
          <span className="font-semibold">IST:</span> {istTime}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
        <span className={`rounded-full px-3 py-1 ${step === 1 ? "bg-sagar-saffron text-white" : "bg-sagar-cream text-sagar-ink/70"}`}>
          1. Contact
        </span>
        <span className={`rounded-full px-3 py-1 ${step === 2 ? "bg-sagar-saffron text-white" : "bg-sagar-cream text-sagar-ink/70"}`}>
          2. Review & Pay
        </span>
      </div>

      <form className="mt-5 space-y-4" onSubmit={submit}>
        {step === 1 ? (
          <>
            <label className="block text-sm text-sagar-ink/80">
              Name
              <input
                required
                value={contact.name}
                onChange={(event) => setContact((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
              />
            </label>
            <label className="block text-sm text-sagar-ink/80">
              Email
              <input
                required
                type="email"
                value={contact.email}
                onChange={(event) => setContact((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
              />
            </label>
            <label className="block text-sm text-sagar-ink/80">
              Phone or WhatsApp (optional)
              <input
                value={contact.phoneOrWhatsapp}
                onChange={(event) => setContact((prev) => ({ ...prev, phoneOrWhatsapp: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={goStepTwo}
                disabled={!contactValid}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
              <a
                href={`/online-puja/${puja.slug}`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/30 px-6 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-sagar-ink/70"
              >
                Back
              </a>
            </div>
          </>
        ) : (
          <>
            <label className="block text-sm text-sagar-ink/80">
              Sankalp intention
              <select
                value={sankalp.intention}
                onChange={(event) => setSankalp((prev) => ({ ...prev, intention: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
              >
                {[
                  "General wellbeing",
                  "Career",
                  "Business",
                  "Family",
                  "Health",
                  "Peace",
                  "New beginning",
                  "Other"
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-sagar-ink/80">
              Devotee names (optional)
              <input
                value={sankalp.devoteeNames}
                onChange={(event) => setSankalp((prev) => ({ ...prev, devoteeNames: event.target.value }))}
                placeholder="Example: Anish, Meera, Rohan"
                className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
              />
            </label>

            <label className="block text-sm text-sagar-ink/80">
              Optional notes
              <textarea
                value={sankalp.notes}
                onChange={(event) => setSankalp((prev) => ({ ...prev, notes: event.target.value }))}
                className="mt-1 min-h-[90px] w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
              />
            </label>

            <div className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/45 px-3 py-2 text-xs text-sagar-ink/70">
              {puja.booking.refundPolicy}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Processing..." : puja.booking.isPaymentEnabled ? "Proceed to Pay" : "Submit Booking Request"}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/30 px-6 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-sagar-ink/70"
              >
                Back
              </button>
            </div>
          </>
        )}
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
