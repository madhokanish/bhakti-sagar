"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import VerseSelection from "@/components/VerseSelection";
import ReadingToolbar from "@/components/ReadingToolbar";
import ReadingSettingsModal from "@/components/ReadingSettingsModal";
import ReadingShareSheet from "@/components/ReadingShareSheet";
import {
  buildFullCopyText,
  buildVerseCopyText,
  defaultReadingPrefs,
  loadReadingPrefs,
  sanitizeLyricLine,
  saveReadingPrefs,
  type ReadingPrefs
} from "@/lib/reading";

type LyricsSet = {
  english: string[];
  hindi: string[];
};

type TitleSet = {
  english: string;
  hindi: string;
};

type Language = "english" | "hindi" | "translit";

export default function AartiLyricsPanel({
  title,
  lyrics,
  slug,
  aartiUrl,
  initialLanguage = "english"
}: {
  title: TitleSet;
  lyrics: LyricsSet;
  slug: string;
  aartiUrl: string;
  initialLanguage?: Language;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<ReadingPrefs>(defaultReadingPrefs);
  const wakeLockRef = useRef<any>(null);
  const scrollKey = `aarti-scroll:${slug}`;
  const prefsKey = `aarti-reading:${slug}`;

  const englishAvailable = lyrics.english.length > 0;
  const hindiAvailable = lyrics.hindi.length > 0;

  const activeLyrics = useMemo(() => {
    if ((language === "english" || language === "translit") && englishAvailable) return lyrics.english;
    if (language === "hindi" && hindiAvailable) return lyrics.hindi;
    if (englishAvailable) return lyrics.english;
    return lyrics.hindi;
  }, [language, englishAvailable, hindiAvailable, lyrics]);

  const activeLanguage = useMemo(() => {
    if ((language === "english" || language === "translit") && englishAvailable) return "english" as const;
    if (language === "hindi" && hindiAvailable) return "hindi" as const;
    if (englishAvailable) return "english" as const;
    return "hindi" as const;
  }, [language, englishAvailable, hindiAvailable]);

  const cleanedLyrics = useMemo(() => activeLyrics.map((line) => sanitizeLyricLine(line)), [activeLyrics]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = loadReadingPrefs(window.localStorage, prefsKey);
    setPrefs(stored);
    if (stored.language) setLanguage(stored.language as Language);
  }, [prefsKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    saveReadingPrefs(window.localStorage, prefsKey, { ...prefs, language });
  }, [prefs, language, prefsKey]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--aarti-font-size", `${prefs.fontSize}px`);
    document.documentElement.style.setProperty("--aarti-line-height", `${prefs.lineHeight}`);
    if (prefs.readingMode) {
      document.documentElement.dataset.readingMode = "on";
    } else {
      delete document.documentElement.dataset.readingMode;
    }
  }, [prefs]);

  useEffect(() => {
    if (!prefs.keepAwake) {
      wakeLockRef.current?.release?.();
      wakeLockRef.current = null;
      return;
    }
    if (typeof navigator === "undefined" || !(navigator as any).wakeLock) return;
    (navigator as any).wakeLock
      .request("screen")
      .then((lock: any) => {
        wakeLockRef.current = lock;
      })
      .catch(() => {
        // ignore
      });
    return () => {
      wakeLockRef.current?.release?.();
      wakeLockRef.current = null;
    };
  }, [prefs.keepAwake]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(scrollKey);
    if (stored) {
      const pos = Number(stored);
      if (!Number.isNaN(pos)) {
        setTimeout(() => window.scrollTo(0, pos), 100);
      }
    }
  }, [scrollKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        window.localStorage.setItem(scrollKey, String(window.scrollY));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollKey]);

  useEffect(() => {
    if (!prefs.autoScroll) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    let active = true;
    const step = Math.max(6, prefs.autoScrollSpeed);
    const interval = window.setInterval(() => {
      if (!active) return;
      window.scrollBy(0, step / 5);
    }, 200);
    const stop = () => {
      active = false;
    };
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("wheel", stop, { passive: true });
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("wheel", stop);
    };
  }, [prefs.autoScroll, prefs.autoScrollSpeed]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const titleText = title.english || title.hindi;

  const handleCopy = (line?: string) => {
    const text = line
      ? buildVerseCopyText({ title: titleText, verse: line, url: aartiUrl })
      : buildFullCopyText({ title: titleText, verses: cleanedLyrics, url: aartiUrl });
    navigator.clipboard.writeText(text);
    setToast(line ? "Verse copied" : "Full lyrics copied");
  };

  const handleShare = async (line?: string) => {
    const text = line
      ? buildVerseCopyText({ title: titleText, verse: line, url: aartiUrl })
      : buildFullCopyText({ title: titleText, verses: cleanedLyrics, url: aartiUrl });
    if (navigator.share) {
      try {
        await navigator.share({ title: titleText, text, url: aartiUrl });
        return;
      } catch {
        // ignore
      }
    }
    await navigator.clipboard.writeText(text);
    setToast(line ? "Verse copied" : "Link copied");
  };

  const languageOptions = [
    { value: "english", label: "English (Roman)" },
    { value: "hindi", label: "Hindi" }
  ];

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Lyrics</p>
          <p className="text-sm text-sagar-ink/70">Tap a verse to highlight and share.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-sagar-amber/30 bg-white p-1 md:flex">
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

      <div className="space-y-5 text-sagar-ink/90 aarti-lyrics">
        <VerseSelection
          lines={cleanedLyrics}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onCopy={(line) => handleCopy(line)}
          onShare={(line) => handleShare(line)}
        />
      </div>

      <ReadingToolbar
        language={activeLanguage}
        languageOptions={languageOptions}
        onLanguageChange={(value) => setLanguage(value as Language)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShare={() => setShareOpen(true)}
      />

      <ReadingSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fontSize={prefs.fontSize}
        lineHeight={prefs.lineHeight}
        readingMode={prefs.readingMode}
        keepAwake={prefs.keepAwake}
        autoScroll={prefs.autoScroll}
        autoScrollSpeed={prefs.autoScrollSpeed}
        onFontSizeChange={(value) => setPrefs((prev) => ({ ...prev, fontSize: value }))}
        onLineHeightChange={(value) => setPrefs((prev) => ({ ...prev, lineHeight: value }))}
        onReadingModeChange={(value) => setPrefs((prev) => ({ ...prev, readingMode: value }))}
        onKeepAwakeChange={(value) => setPrefs((prev) => ({ ...prev, keepAwake: value }))}
        onAutoScrollChange={(value) => setPrefs((prev) => ({ ...prev, autoScroll: value }))}
        onAutoScrollSpeedChange={(value) => setPrefs((prev) => ({ ...prev, autoScrollSpeed: value }))}
      />

      <ReadingShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShareVerse={() => {
          if (selectedIndex == null) {
            handleShare();
          } else {
            handleShare(cleanedLyrics[selectedIndex]);
          }
          setShareOpen(false);
        }}
        onShareFull={() => {
          handleShare();
          setShareOpen(false);
        }}
        onCopyLink={() => {
          navigator.clipboard.writeText(aartiUrl);
          setToast("Link copied");
          setShareOpen(false);
        }}
      />

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-sagar-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
