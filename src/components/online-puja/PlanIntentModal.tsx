"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MembershipMode } from "@/app/online-puja/plans";

export type PlanIntentPayload = {
  fullName: string;
  gotra: string;
  intention: string;
  whatsappOptIn: boolean;
};

type Props = {
  open: boolean;
  planTitle: string;
  mode: MembershipMode;
  onClose: () => void;
  onContinue: (payload: PlanIntentPayload) => void;
};

const intentOptions = [
  { value: "career", label: "Career" },
  { value: "studies", label: "Studies" },
  { value: "health", label: "Health" },
  { value: "family_peace", label: "Family peace" },
  { value: "protection", label: "Protection" },
  { value: "stability", label: "Stability" },
  { value: "other", label: "Other" }
];

export default function PlanIntentModal({ open, planTitle, mode, onClose, onContinue }: Props) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [gotra, setGotra] = useState("");
  const [intention, setIntention] = useState("career");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);

    const focusable = containerRef.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    focusable?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4"
      aria-hidden={!open}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl border border-sagar-amber/25 bg-white p-5 shadow-2xl md:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Step 1</p>
            <h3 id={titleId} className="mt-1 text-2xl font-serif text-sagar-ink">
              {mode === "membership" ? "Join membership" : "Book once"}
            </h3>
            <p className="mt-1 text-sm text-sagar-ink/70">{planTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-sagar-amber/30 px-3 py-1 text-sm text-sagar-ink/70 hover:bg-sagar-cream"
          >
            X
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-sm text-sagar-ink/80">
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-sagar-amber/30 px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
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
              className="mt-1 w-full rounded-xl border border-sagar-amber/30 px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
              placeholder="Don't know? Leave blank"
            />
          </label>
          <label className="block text-sm text-sagar-ink/80">
            Intention
            <select
              value={intention}
              onChange={(event) => setIntention(event.target.value)}
              className="mt-1 w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm outline-none focus:border-sagar-saffron"
            >
              {intentOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-sagar-ink/75">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(event) => setWhatsappOptIn(event.target.checked)}
              className="h-4 w-4 rounded border-sagar-amber/50 text-sagar-saffron focus:ring-sagar-saffron"
            />
            Send me WhatsApp updates
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-sagar-amber/30 px-4 py-2 text-sm font-semibold text-sagar-ink/75 hover:bg-sagar-cream"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={() => {
              if (!fullName.trim()) return;
              onContinue({
                fullName: fullName.trim(),
                gotra: gotra.trim(),
                intention,
                whatsappOptIn
              });
            }}
            className="rounded-full bg-sagar-saffron px-5 py-2 text-sm font-semibold text-white hover:bg-sagar-ember"
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
