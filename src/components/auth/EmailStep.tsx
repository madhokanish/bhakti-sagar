"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";

type EmailStepProps = {
  callbackUrl: string;
  onBack: () => void;
};

const RESEND_COOLDOWN_SECONDS = 30;

export default function EmailStep({ callbackUrl, onBack }: EmailStepProps) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [state, setState] = useState<"entry" | "sent">("entry");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timeout = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [cooldownSeconds]);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function sendLink() {
    if (!normalizedEmail || isSending) {
      if (!normalizedEmail) {
        setMessage("Enter your email to continue.");
      }
      return;
    }

    setIsSending(true);
    setMessage(null);

    try {
      await signIn("email", {
        email: normalizedEmail,
        callbackUrl,
        redirect: false
      });

      setState("sent");
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      setMessage(null);
    } catch {
      // Always show the same response for privacy and anti-enumeration.
      setState("sent");
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      setMessage(null);
    } finally {
      setIsSending(false);
    }
  }

  if (state === "sent") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-sagar-amber/25 bg-sagar-cream/35 p-4">
          <p className="text-sm font-semibold text-sagar-ink">Check your email</p>
          <p className="mt-1 text-sm text-sagar-ink/75">
            If an account exists for <span className="font-medium">{normalizedEmail}</span>, you will receive a magic link shortly.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void sendLink()}
            disabled={cooldownSeconds > 0 || isSending}
            className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending
              ? "Sending..."
              : cooldownSeconds > 0
                ? `Resend in ${cooldownSeconds}s`
                : "Resend link"}
          </button>

          <button
            type="button"
            onClick={() => {
              setState("entry");
              setCooldownSeconds(0);
            }}
            className="rounded-full border border-sagar-amber/35 px-4 py-2 text-sm font-semibold text-sagar-ink/80 transition hover:border-sagar-amber/55"
          >
            Change email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-sagar-ink/55">
          Email address
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          className="h-12 w-full rounded-2xl border border-sagar-amber/30 bg-white px-4 text-[16px] text-sagar-ink outline-none transition focus:border-sagar-saffron/60"
        />
      </label>

      {message ? <p className="text-xs text-sagar-ink/70">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void sendLink()}
          disabled={isSending}
          className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? "Sending..." : "Send magic link"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-sagar-amber/35 px-4 py-2 text-sm font-semibold text-sagar-ink/80 transition hover:border-sagar-amber/55"
        >
          Back
        </button>
      </div>
    </div>
  );
}
