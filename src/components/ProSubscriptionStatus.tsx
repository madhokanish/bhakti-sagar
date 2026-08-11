"use client";

import { useState } from "react";

type Props = {
  status: string;
  currentPeriodEnd: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

export default function ProSubscriptionStatus({ status, currentPeriodEnd }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState<{ immediately: boolean; accessUntil: string | null } | null>(
    null
  );

  async function cancelSubscription() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/razorpay/subscription/cancel", { method: "POST" });
      const data = (await response.json()) as {
        cancelledImmediately?: boolean;
        accessUntil?: string | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel subscription.");
      }
      setCancelled({
        immediately: data.cancelledImmediately ?? true,
        accessUntil: data.accessUntil ?? (data.cancelledImmediately ? null : currentPeriodEnd)
      });
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel subscription.");
    } finally {
      setLoading(false);
    }
  }

  const renewsLabel = formatDate(currentPeriodEnd);

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft md:p-8">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-sagar-saffron px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Pro
        </span>
        <p className="text-lg font-semibold text-sagar-ink">
          {status === "trialing" ? "Your trial is active" : "Your membership is active"}
        </p>
      </div>

      {cancelled ? (
        <p className="mt-3 text-sm text-sagar-ink/80">
          {cancelled.immediately ? (
            "Subscription cancelled, no charges will be made."
          ) : (
            <>
              Subscription cancelled — you keep Pro access until{" "}
              <strong>{formatDate(cancelled.accessUntil)}</strong>, then it won&apos;t renew.
            </>
          )}
        </p>
      ) : (
        <>
          {renewsLabel ? (
            <p className="mt-3 text-sm text-sagar-ink/78">Renews on {renewsLabel}.</p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-sagar-rose">{error}</p> : null}
          <div className="mt-5">
            <button
              type="button"
              onClick={cancelSubscription}
              disabled={loading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/35 px-6 py-2 text-sm font-semibold text-sagar-ink/75 transition hover:border-sagar-amber/60 hover:text-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Cancelling..." : "Cancel subscription"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
