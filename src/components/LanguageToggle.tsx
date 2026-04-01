"use client";

import { type HomeLang } from "@/lib/homeCopy";
import { setBhaktiLangPreference } from "@/lib/useBhaktiLang";

type Props = {
  currentLang: HomeLang;
  onChange: (lang: HomeLang) => void;
  compact?: boolean;
};

const OPTIONS: Array<{ value: HomeLang; label: string }> = [
  { value: "en", label: "English" },
  { value: "hinglish", label: "Hinglish" },
  { value: "hi", label: "हिंदी" }
];

export default function LanguageToggle({ currentLang, onChange, compact = false }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Language"
      className={`inline-flex items-center rounded-full border border-sagar-amber/30 bg-[#fffdf9] p-0.5 text-xs font-semibold text-sagar-ink/70 shadow-[0_12px_28px_-24px_rgba(33,13,7,0.65)] ${
        compact ? "" : ""
      }`}
    >
      {OPTIONS.map((option) => {
        const active = option.value === currentLang;

        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => {
              if (option.value === currentLang) return;
              setBhaktiLangPreference(option.value);
              onChange(option.value);
            }}
            className={`rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron/60 ${
              compact ? "px-2 py-1" : "px-2.5 py-1"
            } ${
              active
                ? "bg-sagar-ink text-white shadow-[0_8px_16px_-12px_rgba(30,12,6,0.9)]"
                : "text-sagar-ink/75 hover:text-sagar-ember"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
