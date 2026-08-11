"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type AuthButtonsProps = {
  callbackUrl: string;
};

export default function AuthButtons({ callbackUrl }: AuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<"google" | null>(null);
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleProviderSignIn(provider: "google") {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl });
    } finally {
      setLoadingProvider(null);
    }
  }

  async function handleUsernameSignIn(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password })
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Sign-in failed.");
      }
      window.location.href = callbackUrl;
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign-in failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void handleProviderSignIn("google")}
        disabled={Boolean(loadingProvider)}
        className="relative flex min-h-12 w-full items-center justify-center rounded-full bg-[#111111] px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="pointer-events-none absolute left-4 inline-flex h-5 w-5 items-center justify-center">
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
        </span>
        {loadingProvider === "google" ? "Connecting Google..." : "Continue with Google"}
      </button>

      {showUsernameForm ? (
        <form onSubmit={handleUsernameSignIn} className="space-y-2 rounded-2xl border border-sagar-amber/20 p-3">
          <input
            type="text"
            autoComplete="username"
            placeholder="Username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            className="w-full rounded-xl border border-sagar-amber/25 px-3 py-2 text-sm text-sagar-ink"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-sagar-amber/25 px-3 py-2 text-sm text-sagar-ink"
          />
          {error ? <p className="text-xs text-sagar-rose">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-sagar-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowUsernameForm(true)}
          className="w-full text-center text-xs text-sagar-ink/60 underline"
        >
          Enter username or password
        </button>
      )}
    </div>
  );
}
