"use client";

import { HOME_LANG_COOKIE, HOME_LANG_STORAGE_KEY, type HomeLang } from "@/lib/homeCopy";

type HomeLanguageToggleProps = {
  currentLang: HomeLang;
  onChange: (lang: HomeLang) => void;
};

const OPTIONS: { value: HomeLang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hinglish", label: "Hinglish" },
  { value: "hi", label: "हिंदी" }
];

export default function HomeLanguageToggle({ currentLang, onChange }: HomeLanguageToggleProps) {
  const handleSelect = (lang: HomeLang) => {
    if (lang === currentLang) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HOME_LANG_STORAGE_KEY, lang);
      document.cookie = `${HOME_LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    }
    onChange(lang);
  };

  return (
    <div
      className="inline-flex items-center rounded-full border border-sagar-amber/30 bg-[#fffdf9] p-0.5 text-xs font-semibold text-sagar-ink/70 shadow-[0_12px_28px_-24px_rgba(33,13,7,0.65)]"
      role="group"
      aria-label="Homepage language"
    >
      {OPTIONS.map((option) => {
        const active = option.value === currentLang;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`rounded-full px-2.5 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron/60 ${
              active
                ? "bg-sagar-ink text-white shadow-[0_8px_16px_-12px_rgba(30,12,6,0.9)]"
                : "text-sagar-ink/75 hover:text-sagar-ember"
            }`}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
