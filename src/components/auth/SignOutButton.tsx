"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        if (isLoading) return;
        setIsLoading(true);
        await signOut({ callbackUrl: "/" });
      }}
      disabled={isLoading}
      className="rounded-xl border border-sagar-amber/35 bg-white px-4 py-2 text-sm font-semibold text-sagar-ink transition hover:border-sagar-amber/60 hover:bg-sagar-cream/40 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </button>
  );
}
