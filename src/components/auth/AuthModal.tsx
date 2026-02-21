"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthButtons from "@/components/auth/AuthButtons";

type AuthModalProps = {
  open: boolean;
  callbackUrl: string;
  onClose: () => void;
};

function focusableElements(container: HTMLElement) {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1
  );
}

export default function AuthModal({ open, callbackUrl, onClose }: AuthModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusModal = () => {
      const container = modalRef.current;
      if (!container) return;

      const focusables = focusableElements(container);
      const first = focusables[0] ?? container;
      first.focus();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const container = modalRef.current;
      if (!container) return;

      const focusables = focusableElements(container);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const animationFrame = requestAnimationFrame(focusModal);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="w-full max-w-md rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-[0_20px_60px_-18px_rgba(0,0,0,0.55)] sm:p-7"
        tabIndex={-1}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-modal-title" className="text-2xl font-bold text-sagar-ink">
              Continue to Bhakti Chat
            </h2>
            <p className="mt-1 text-sm text-sagar-ink/70">Sign in in seconds</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 text-sagar-ink/75 transition hover:border-sagar-amber/55"
            aria-label="Close authentication modal"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <AuthButtons callbackUrl={callbackUrl} />

        <p className="mt-5 text-xs leading-relaxed text-sagar-ink/60">
          By continuing, you agree with the <Link className="underline" href="/terms">Terms</Link> and{" "}
          <Link className="underline" href="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
