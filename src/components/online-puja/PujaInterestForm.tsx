"use client";

import { FormEvent, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  pujaTitle: string;
  pujaSlug: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  additionalInfo: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  additionalInfo: ""
};

export default function PujaInterestForm({ pujaTitle, pujaSlug }: Props) {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string>("");
  const [started, setStarted] = useState(false);

  const isValid = useMemo(() => {
    const email = form.email.trim();
    return form.name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [form.email, form.name]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setError("");

    try {
      const response = await fetch("/api/online-puja-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pujaTitle,
          pujaSlug,
          ...form
        })
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit your request.");
      }

      setStatus("success");
      trackEvent("form_submit", { puja_slug: pujaSlug });
      setForm(initialState);
      setStarted(false);
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function markStarted() {
    if (started) return;
    setStarted(true);
    trackEvent("form_start", { puja_slug: pujaSlug });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} aria-label={`${pujaTitle} interest form`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-sagar-ink/80">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            onFocus={markStarted}
            className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
            required
          />
        </label>
        <label className="text-sm text-sagar-ink/80">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            onFocus={markStarted}
            className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
            required
          />
        </label>
      </div>
      <label className="text-sm text-sagar-ink/80">
        Phone (optional)
        <input
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          onFocus={markStarted}
          className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
        />
      </label>
      <label className="text-sm text-sagar-ink/80">
        Additional Information
        <textarea
          value={form.additionalInfo}
          onChange={(event) => setForm((prev) => ({ ...prev, additionalInfo: event.target.value }))}
          onFocus={markStarted}
          className="mt-1 min-h-[120px] w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
          placeholder="Share your sankalp, family names, or any specific prayer request."
        />
      </label>
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full rounded-full bg-sagar-saffron px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? "Submitting..." : "Submit Interest"}
      </button>
      {status === "success" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Thank you. We have received your request and will reach out with next steps.
        </p>
      )}
      {status === "error" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || "Unable to submit right now. Please try again."}
        </p>
      )}
    </form>
  );
}
