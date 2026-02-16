"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { trackEvent } from "@/lib/analytics";

type Props = {
  open: boolean;
  onClose: () => void;
  featureName: string;
  returnTo: string;
  priceLabel: string;
};

export default function PaywallModal({ open, onClose, featureName, returnTo, priceLabel }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    trackEvent("paywall_viewed", { feature: featureName, return_to: returnTo });
  }, [featureName, open, returnTo]);

  useEffect(() => {
    if (!open) {
      setError("");
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button, textarea, input, select, [tabindex]:not([tabindex='-1'])"
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const focusTimer = window.setTimeout(() => {
      const focusable = dialogRef.current?.querySelector<HTMLElement>(
        "button, input, a[href]"
      );
      focusable?.focus();
    }, 0);

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function startTrial() {
    if (loading) return;
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          returnUrl: returnTo
        })
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start free trial.");
      }
      trackEvent("trial_started", { feature: featureName });
      window.location.href = data.url;
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to continue.");
      setLoading(false);
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-4 md:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl rounded-3xl border border-sagar-amber/25 bg-white p-5 shadow-sagar-card md:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif text-sagar-ink">Start your 14 day free trial</h2>
            <p className="mt-2 text-sm text-sagar-ink/72">
              Premium access for Live Darshan 24x7, Online Puja booking, and member-only features.
            </p>
            <p className="mt-2 text-base font-semibold text-sagar-ink">Then {priceLabel} per month</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-sagar-amber/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sagar-ink/70"
          >
            Close
          </button>
        </div>

        <ul className="mt-4 space-y-1.5 text-sm text-sagar-ink/78">
          <li>• No charge today</li>
          <li>• Cancel anytime</li>
          <li>• We will remind you before the trial ends</li>
        </ul>

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

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startTrial}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Redirecting..." : "Start free trial"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/30 px-6 py-2 text-sm font-semibold text-sagar-ink/75"
          >
            Maybe later
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
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
