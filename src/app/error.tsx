"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[App error boundary]", error);
    }
  }, [error]);

  return (
    <div
      className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center"
      role="alert"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sagar-rose">
        Om Shanti
      </p>
      <h1 className="mt-4 font-serif text-3xl text-sagar-ink md:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-sagar-ink/70">
        We could not complete that request. Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-sagar-saffron px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sagar-soft transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron/60"
      >
        Try again
      </button>
    </div>
  );
}
