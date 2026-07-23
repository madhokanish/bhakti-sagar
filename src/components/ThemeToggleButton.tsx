"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggleButton({ className = "" }: { className?: string }) {
  const { mode, cycleMode } = useTheme();

  const label =
    mode === "light" ? "Switch to dark theme" : mode === "dark" ? "Switch to system theme" : "Switch to light theme";

  return (
    <button
      type="button"
      onClick={cycleMode}
      aria-label={label}
      title={label}
      className={
        className ||
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 bg-white/90 text-sagar-ink/75 shadow-[0_10px_26px_-24px_rgba(44,20,10,0.65)] transition-colors duration-200 hover:border-sagar-amber/55 hover:bg-sagar-sand/40 hover:text-sagar-ink"
      }
    >
      {mode === "dark" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
          <path
            d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : mode === "light" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
          <rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
