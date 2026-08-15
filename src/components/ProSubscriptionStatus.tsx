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

// Cancellation is deliberately a two-step, opt-out-friendly flow. The old single button gave
// no clear feedback (cancel-at-cycle-end keeps Pro until period end, so nothing visibly
// changed) and people tapped it repeatedly, unsure it worked. Now each step defaults to
// keeping the membership, and success lands on an unmistakable confirmation.
type CancelStep = "idle" | "confirm1" | "confirm2";

export default function ProSubscriptionStatus({ status, currentPeriodEnd }: Props) {
  const [step, setStep] = useState<CancelStep>("idle");
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
      setStep("idle");
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
  const accessUntilLabel = formatDate(currentPeriodEnd);

  // --- Cancelled: the clear end state the old flow never showed. -----------------------
  if (cancelled) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-sagar-amber/20 bg-white p-6 text-center shadow-sagar-soft md:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-black text-sagar-ink md:text-3xl">
          {cancelled.immediately ? "Membership cancelled" : "Cancellation scheduled"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sagar-ink/80">
          {cancelled.immediately ? (
            "Your membership has been cancelled and no further charges will be made."
          ) : (
            <>
              You&apos;ll keep BhaktiChat Pro until{" "}
              <strong className="text-sagar-ink">{formatDate(cancelled.accessUntil)}</strong>, then it
              won&apos;t renew. No further charges will be made.
            </>
          )}
        </p>
        <p className="mt-4 text-sm text-sagar-ink/60">A confirmation has also been emailed to you.</p>
      </section>
    );
  }

  // --- Active membership. --------------------------------------------------------------
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-sagar-amber/25 bg-white p-6 shadow-sagar-soft md:p-8">
      {/* Issue 2: lead with a big, unambiguous "you're Pro" so this reads as a membership
          page, not a faint status line. */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sagar-saffron px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          ★ Pro
        </span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-sagar-ink md:text-4xl">
          {status === "trialing" ? "Your Pro trial is active" : "You're a Pro member"}
        </h1>
        <p className="mt-2 text-sagar-ink/70">
          {status === "trialing"
            ? "Enjoy full access to everything BhaktiChat offers."
            : "Thank you for supporting BhaktiChat. You have full access to everything."}
        </p>
        {renewsLabel ? (
          <p className="mt-4 inline-block rounded-full bg-sagar-cream px-4 py-1.5 text-sm font-medium text-sagar-ink/75">
            Renews on {renewsLabel}
          </p>
        ) : null}
      </div>

      {/* Cancellation lives below a divider, deliberately quiet. */}
      <div className="mt-8 border-t border-sagar-amber/15 pt-6">
        {step === "idle" ? (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep("confirm1");
              }}
              className="text-sm font-medium text-sagar-ink/45 underline-offset-4 transition hover:text-sagar-ink/70 hover:underline"
            >
              Cancel membership
            </button>
          </div>
        ) : null}

        {/* Step 1 — first confirmation. Primary action keeps the membership. */}
        {step === "confirm1" ? (
          <div className="rounded-2xl border border-sagar-amber/25 bg-sagar-cream/60 p-5 text-center">
            <p className="text-lg font-bold text-sagar-ink">Cancel your membership?</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-sagar-ink/75">
              You&apos;ll lose unlimited access to BhaktiChat Pro
              {accessUntilLabel ? (
                <>
                  {" "}
                  when the current period ends on <strong>{accessUntilLabel}</strong>
                </>
              ) : null}
              .
            </p>
            <div className="mt-5 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setStep("confirm2")}
                className="min-h-[44px] w-full rounded-full border border-sagar-amber/35 px-6 text-sm font-semibold text-sagar-ink/70 transition hover:border-sagar-rose/50 hover:text-sagar-rose sm:w-auto"
              >
                Continue to cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("idle")}
                className="min-h-[44px] w-full rounded-full bg-sagar-saffron px-6 text-sm font-bold text-white shadow-sagar-soft transition hover:brightness-105 sm:w-auto"
              >
                Keep my membership
              </button>
            </div>
          </div>
        ) : null}

        {/* Step 2 — final confirmation, with the destructive action clearly marked. */}
        {step === "confirm2" ? (
          <div className="rounded-2xl border border-sagar-rose/30 bg-sagar-rose/5 p-5 text-center">
            <p className="text-lg font-bold text-sagar-ink">Are you absolutely sure?</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-sagar-ink/75">
              This is final. Your BhaktiChat Pro
              {accessUntilLabel ? (
                <>
                  {" "}
                  won&apos;t renew after <strong>{accessUntilLabel}</strong>
                </>
              ) : (
                " will be cancelled"
              )}
              , and you&apos;ll go back to the free limits.
            </p>
            {error ? <p className="mt-3 text-sm text-sagar-rose">{error}</p> : null}
            <div className="mt-5 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={cancelSubscription}
                disabled={loading}
                className="min-h-[44px] w-full rounded-full border border-sagar-rose/50 px-6 text-sm font-semibold text-sagar-rose transition hover:bg-sagar-rose hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Cancelling…" : "Yes, cancel membership"}
              </button>
              <button
                type="button"
                onClick={() => setStep("idle")}
                disabled={loading}
                className="min-h-[44px] w-full rounded-full bg-sagar-saffron px-6 text-sm font-bold text-white shadow-sagar-soft transition hover:brightness-105 disabled:opacity-60 sm:w-auto"
              >
                Keep my membership
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
