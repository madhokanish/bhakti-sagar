"use client";

type LanguageOption = { value: string; label: string };

type Props = {
  language: string;
  languageOptions: LanguageOption[];
  onLanguageChange: (value: string) => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
};

export default function ReadingToolbar({
  language,
  languageOptions,
  onLanguageChange,
  onOpenSettings,
  onOpenShare
}: Props) {
  return (
    <div className="fixed bottom-3 left-1/2 z-40 w-[94%] -translate-x-1/2 rounded-full border border-sagar-amber/20 bg-white px-3 py-2 shadow-sagar-soft md:hidden">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 text-xs font-semibold text-sagar-ink"
          aria-label="Reading settings"
        >
          Aa
        </button>
        <div className="flex-1">
          <label className="sr-only" htmlFor="reading-language">
            Language
          </label>
          <select
            id="reading-language"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="w-full rounded-full border border-sagar-amber/30 bg-white px-3 py-2 text-xs font-semibold text-sagar-ink"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onOpenShare}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 text-sagar-ink"
          aria-label="Share"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M15 8a3 3 0 1 0-2.83-4H12a3 3 0 0 0 3 3zm-6 4a3 3 0 1 0 2.83 4H12a3 3 0 0 0-3-3zm9-2.5a3 3 0 0 0-2.47 1.3l-4.29-2.2a3 3 0 0 0 0-1.2l4.29-2.2A3 3 0 1 0 15 5.5l-4.29 2.2a3 3 0 1 0 0 4.6l4.29 2.2A3 3 0 1 0 18 9.5z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
