"use client";

import { useMemo, useState } from "react";
import MeaningPanel from "@/components/MeaningPanel";

type LyricsSet = {
  english: string[];
  hindi: string[];
};

type TitleSet = {
  english: string;
  hindi: string;
};

type Language = "english" | "hindi";

export default function AartiLyricsPanel({
  title,
  lyrics
}: {
  title: TitleSet;
  lyrics: LyricsSet;
}) {
  const [language, setLanguage] = useState<Language>("english");

  const englishAvailable = lyrics.english.length > 0;
  const hindiAvailable = lyrics.hindi.length > 0;

  const activeLyrics = useMemo(() => {
    if (language === "english" && englishAvailable) return lyrics.english;
    if (language === "hindi" && hindiAvailable) return lyrics.hindi;
    if (englishAvailable) return lyrics.english;
    return lyrics.hindi;
  }, [language, englishAvailable, hindiAvailable, lyrics]);

  const activeLanguage = useMemo(() => {
    if (language === "english" && englishAvailable) return "english";
    if (language === "hindi" && hindiAvailable) return "hindi";
    if (englishAvailable) return "english";
    return "hindi";
  }, [language, englishAvailable, hindiAvailable]);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Lyrics</p>
          <p className="text-sm text-sagar-ink/70">Switch language for reading comfort.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-sagar-amber/30 bg-white p-1">
          <button
            onClick={() => setLanguage("english")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              activeLanguage === "english"
                ? "bg-sagar-saffron text-white"
                : "text-sagar-ink/60 hover:text-sagar-ink"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("hindi")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              activeLanguage === "hindi"
                ? "bg-sagar-saffron text-white"
                : "text-sagar-ink/60 hover:text-sagar-ink"
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {!englishAvailable && activeLanguage === "hindi" && (
        <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/70 p-4 text-sm text-sagar-ink/70">
          English transliteration will be added once the English document is parsed.
        </div>
      )}

      <div className="space-y-3 text-lg leading-relaxed text-sagar-ink/80">
        {activeLyrics.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}
