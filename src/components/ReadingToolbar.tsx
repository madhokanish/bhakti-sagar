"use client";

type LanguageOption = { value: string; label: string };

type Props = {
  language: string;
  languageOptions: LanguageOption[];
  onLanguageChange: (value: string) => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onTogglePlay?: () => void;
  isPlaying?: boolean;
};

export default function ReadingToolbar({
  language,
  languageOptions,
  onLanguageChange,
  onOpenSettings,
  onOpenShare,
  onTogglePlay,
  isPlaying = false
}: Props) {
  const playIcon = isPlaying ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M7 5v14l12-7z" fill="currentColor" />
    </svg>
  );
  return (
    <>
      {/* Mobile toolbar — horizontal pill at bottom */}
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
            <label className="sr-only" htmlFor="reading-language-mobile">
              Language
            </label>
            <select
              id="reading-language-mobile"
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
          {onTogglePlay ? (
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 text-sagar-ink"
              aria-label={isPlaying ? "Stop reading" : "Read aloud"}
              aria-pressed={isPlaying}
            >
              {playIcon}
            </button>
          ) : null}
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

      {/* Desktop toolbar — vertical pill on right side */}
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-2xl border border-sagar-amber/20 bg-white/90 px-2 py-3 shadow-sagar-soft backdrop-blur-sm md:flex">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 text-xs font-semibold text-sagar-ink transition-colors hover:border-sagar-saffron/50 hover:text-sagar-ember"
          aria-label="Reading settings"
          title="Reading settings"
        >
          Aa
        </button>

        <div className="h-px w-6 bg-sagar-amber/25" />

        <div className="flex flex-col gap-1">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onLanguageChange(option.value)}
              aria-pressed={language === option.value}
              className={`rounded-full px-2 py-1 text-[10px] font-semibold transition-colors ${
                language === option.value
                  ? "bg-sagar-amber/20 text-sagar-ember"
                  : "text-sagar-ink/60 hover:text-sagar-ember"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="h-px w-6 bg-sagar-amber/25" />

        {onTogglePlay ? (
          <button
            type="button"
            onClick={onTogglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 text-sagar-ink/70 transition-colors hover:border-sagar-saffron/50 hover:text-sagar-ember"
            aria-label={isPlaying ? "Stop reading" : "Read aloud"}
            aria-pressed={isPlaying}
            title={isPlaying ? "Stop reading" : "Read aloud"}
          >
            {playIcon}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onOpenShare}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sagar-amber/30 text-sagar-ink/70 transition-colors hover:border-sagar-saffron/50 hover:text-sagar-ember"
          aria-label="Share"
          title="Share"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M15 8a3 3 0 1 0-2.83-4H12a3 3 0 0 0 3 3zm-6 4a3 3 0 1 0 2.83 4H12a3 3 0 0 0-3-3zm9-2.5a3 3 0 0 0-2.47 1.3l-4.29-2.2a3 3 0 0 0 0-1.2l4.29-2.2A3 3 0 1 0 15 5.5l-4.29 2.2a3 3 0 1 0 0 4.6l4.29 2.2A3 3 0 1 0 18 9.5z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
