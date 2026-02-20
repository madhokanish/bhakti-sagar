"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type OAuthSignInButtonsProps = {
  callbackUrl: string;
};

export default function OAuthSignInButtons({ callbackUrl }: OAuthSignInButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);

  async function handleSignIn(provider: "google" | "apple") {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl });
    } finally {
      setLoadingProvider(null);
    }
  }

  const isLoading = (provider: "google" | "apple") => loadingProvider === provider;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => handleSignIn("google")}
        disabled={Boolean(loadingProvider)}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-sagar-amber/35 bg-white px-4 py-3 text-sm font-semibold text-sagar-ink transition hover:border-sagar-amber/60 hover:bg-sagar-cream/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.8-4.1 2.8-6.9 0-.6-.1-1.2-.2-1.8H12z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.5-1.7-5.3-4H3.5v2.5C5 19.8 8.2 22 12 22z"
          />
          <path
            fill="#4A90E2"
            d="M6.7 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3.5C2.8 8.9 2.4 10.4 2.4 12s.4 3.1 1.1 4.5L6.7 14z"
          />
          <path
            fill="#FBBC05"
            d="M12 6.1c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.8 3.3 14.6 2.4 12 2.4c-3.8 0-7 2.2-8.5 5.1l3.2 2.5c.8-2.3 2.8-3.9 5.3-3.9z"
          />
        </svg>
        {isLoading("google") ? "Connecting Google..." : "Continue with Google"}
      </button>

      <button
        type="button"
        onClick={() => handleSignIn("apple")}
        disabled={Boolean(loadingProvider)}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-sagar-amber/35 bg-sagar-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-sagar-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
          <path d="M17.4 12.6c0-2.3 1.9-3.4 2-3.4-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.7-.9-2.9-.9-1.5 0-2.8.9-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.7.8 1 1.7 2.1 2.9 2.1 1.2 0 1.7-.7 3.2-.7s1.9.7 3.2.7c1.3 0 2.1-1.1 2.9-2.1.9-1.1 1.2-2.1 1.2-2.2-.1 0-2.3-.9-2.3-3.5z" />
          <path d="M15.2 5.9c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.2.7-2.9 1.6-.6.8-1.2 2-1 3.2 1.1.1 2.2-.5 2.8-1.5z" />
        </svg>
        {isLoading("apple") ? "Connecting Apple..." : "Continue with Apple"}
      </button>
    </div>
  );
}
