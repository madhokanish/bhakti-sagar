"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHADHAAVA_COPY, type CheckoutLang } from "@/lib/chadhaavaCopy";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type Props = {
  email: string;
  /** Carried over from the app so this page speaks the language they were just reading. */
  lang: CheckoutLang;
};

export default function UpiAutopayTestClient({ email, lang }: Props) {
  const copy = CHADHAAVA_COPY[lang];
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ status: string } | null>(null);
  // Most arrivals here come straight from tapping "pay" in the app, so checkout opens by
  // itself (see the effect below). This guards against it firing twice -- on a re-render, or
  // after the user has dismissed it and is looking at the retry button.
  const autoOpenedRef = useRef(false);

  const startSubscription = useCallback(async function startSubscription() {
    if (loading) return;
    if (!scriptReady || !window.Razorpay) {
      setError("Payment script hasn't loaded yet — try again in a moment.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const createResponse = await fetch("/api/razorpay/subscription/create", {
        method: "POST"
      });
      const createData = (await createResponse.json()) as { subscriptionId?: string; error?: string };
      if (!createResponse.ok || !createData.subscriptionId) {
        throw new Error(createData.error || "Unable to start subscription.");
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const razorpay = new window.Razorpay({
        key: keyId,
        subscription_id: createData.subscriptionId,
        name: "BhaktiChat",
        description: "Monthly membership (test)",
        prefill: { email },
        theme: { color: "#c2410c" },
        handler: async (response: unknown) => {
          const payload = response as RazorpayCheckoutSuccess;
          try {
            const verifyResponse = await fetch("/api/razorpay/subscription/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const verifyData = (await verifyResponse.json()) as { status?: string; error?: string };
            if (!verifyResponse.ok || !verifyData.status) {
              throw new Error(verifyData.error || "Verification failed.");
            }
            setResult({ status: verifyData.status });
          } catch (verifyError) {
            setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setError("Payment cancelled.");
            setLoading(false);
          }
        }
      });

      razorpay.on("payment.failed", (response: unknown) => {
        const failure = response as { error?: { description?: string } };
        setError(failure?.error?.description || "Payment failed.");
        setLoading(false);
      });

      razorpay.open();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start subscription.");
      setLoading(false);
    }
  }, [email, loading, scriptReady]);

  // Open checkout as soon as we can, rather than making the user tap again.
  //
  // People reach this page by tapping "pay" in the app; the page itself is a handoff, not a
  // destination, and an extra tap here is a pure drop-off point. Razorpay renders as an
  // in-page overlay rather than a popup, so opening it without a click is not blocked.
  //
  // If they dismiss it, autoOpenedRef keeps it dismissed and the page below acts as the
  // retry surface -- reopening automatically would trap them.
  useEffect(() => {
    if (!scriptReady || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    void startSubscription();
  }, [scriptReady, startSubscription]);

  return (
    // Mirrors the app's चढ़ावा screen: same palette, same order, same wording. The user tapped
    // "pay" one screen ago, so this should read as that screen continuing rather than a
    // different site asking them to start over.
    <div className="mx-auto max-w-lg">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      {/* Price card. ₹5 carries the offer; the ₹199 renewal sits below as a quiet pill —
          stated plainly because people deserve to know what they are signing up for, but
          not competing with the number that actually gets charged today. */}
      <section className="rounded-3xl border border-[#4DEA580C] bg-white p-6 shadow-[0_10px_40px_-24px_rgba(120,64,40,0.5)]">
        <p className="text-center">
          <span className="align-middle text-6xl font-black tracking-tight text-[#EA580C]">₹5</span>
          <span className="ml-2 align-middle text-2xl font-bold text-[#2A1C15]">{copy.priceNow}</span>
        </p>
        <p className="mt-2 text-center text-sm text-[#8A6F5C]">{copy.priceSub}</p>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#5257A075] bg-[#F2F8F4] p-4">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#57A075] text-sm font-bold text-white"
          >
            ✓
          </span>
          <span>
            <span className="block text-sm font-bold text-[#2F6B4A]">{copy.refundTitle}</span>
            <span className="mt-0.5 block text-sm text-[#4F7A62]">{copy.refundSub}</span>
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#14784028] pt-4">
          <span className="rounded-full bg-[#F7EFE6] px-4 py-2 text-sm font-semibold text-[#4A382E]">
            {copy.planPrice}
          </span>
          <span className="text-sm text-[#8A6F5C]">{copy.cancelAnytime}</span>
        </div>
      </section>

      {/* Status sits directly above the button. After a dismissal "Payment cancelled" only
          means something next to the control that retries it. */}
      {error ? <p className="mt-4 text-center text-sm text-[#C2410C]">{error}</p> : null}
      {result ? (
        <p className="mt-4 text-center text-sm font-semibold text-[#2F6B4A]">{copy.verified}</p>
      ) : null}

      {/* Deliberately above the benefits. Checkout opens by itself, so by the time anyone is
          reading this page they have already dismissed it — this button is the whole point of
          the page at that moment, and below the benefits list it sat off-screen on a phone. */}
      <div className={error || result ? "mt-3" : "mt-5"}>
        <button
          type="button"
          onClick={() => void startSubscription()}
          disabled={loading}
          className="flex min-h-[56px] w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-[#FB923C] to-[#EA580C] px-6 text-white shadow-[0_10px_30px_-14px_rgba(234,88,12,0.9)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-base font-extrabold">{loading ? copy.opening : copy.reopen}</span>
          {!loading ? <span className="mt-0.5 text-xs opacity-95">{copy.ctaLine2}</span> : null}
        </button>
      </div>

      <p className="mt-3 text-center text-sm text-[#8A6F5C]">
        {copy.subscribingAs} <span className="font-semibold text-[#2A1C15]">{email}</span>
      </p>

      <section className="mt-7">
        <h2 className="text-lg font-bold text-[#2A1C15]">{copy.benefitsTitle}</h2>
        <ul className="mt-3 space-y-3">
          {copy.benefits.map((benefit) => (
            <li key={benefit.title} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#57A075] text-sm font-bold text-white"
              >
                ✓
              </span>
              <span>
                <span className="block text-base font-bold text-[#2A1C15]">{benefit.title}</span>
                <span className="mt-0.5 block text-sm text-[#8A6F5C]">{benefit.sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
