"use client";

import Script from "next/script";
import { useState } from "react";

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

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function UpiAutopayTestClient() {
  const [email, setEmail] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ status: string } | null>(null);

  async function startSubscription() {
    if (loading) return;
    if (!validEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!scriptReady || !window.Razorpay) {
      setError("Payment script hasn't loaded yet — try again in a moment.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const createResponse = await fetch("/api/razorpay/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
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
  }

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft md:p-8">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
        <p className="text-lg font-semibold text-sagar-ink">₹1 for 3 days, then ₹199/month</p>
        <ul className="mt-2 space-y-1 text-sm text-sagar-ink/78">
          <li>• UPI AutoPay mandate via Razorpay Checkout</li>
          <li>• Auto-renews monthly, cancel anytime</li>
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
      {result ? (
        <p className="mt-2 text-sm text-green-700">
          Verified. Subscription status: <strong>{result.status}</strong>
        </p>
      ) : null}

      <div className="mt-5">
        <button
          type="button"
          onClick={startSubscription}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Processing..." : "Start trial with UPI AutoPay"}
        </button>
      </div>
    </section>
  );
}
