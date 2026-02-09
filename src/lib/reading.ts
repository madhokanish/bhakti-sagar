export type ReadingPrefs = {
  fontSize: number; // px
  lineHeight: number;
  readingMode: boolean;
  keepAwake: boolean;
  autoScroll: boolean;
  autoScrollSpeed: number; // px per second
  language: "english" | "hindi" | "translit";
};

export const defaultReadingPrefs: ReadingPrefs = {
  fontSize: 18,
  lineHeight: 1.6,
  readingMode: false,
  keepAwake: false,
  autoScroll: false,
  autoScrollSpeed: 18,
  language: "english"
};

export function sanitizeLyricLine(line: string) {
  const cleaned = line.replace(/\s+$/g, "");
  if (cleaned.endsWith("?") && cleaned.indexOf("?") === cleaned.length - 1) {
    return cleaned.replace(/\s*\?$/g, "");
  }
  return cleaned;
}

export function buildVerseCopyText({
  title,
  verse,
  url
}: {
  title: string;
  verse: string;
  url?: string;
}) {
  return `${title}\n${verse}${url ? `\n${url}` : ""}`;
}

export function buildFullCopyText({
  title,
  verses,
  url
}: {
  title: string;
  verses: string[];
  url?: string;
}) {
  return `${title}\n\n${verses.join("\n")}${url ? `\n\n${url}` : ""}`;
}

export function loadReadingPrefs(storage: Storage | null, key: string): ReadingPrefs {
  if (!storage) return { ...defaultReadingPrefs };
  const raw = storage.getItem(key);
  if (!raw) return { ...defaultReadingPrefs };
  try {
    const parsed = JSON.parse(raw) as Partial<ReadingPrefs>;
    return { ...defaultReadingPrefs, ...parsed };
  } catch {
    return { ...defaultReadingPrefs };
  }
}

export function saveReadingPrefs(storage: Storage | null, key: string, prefs: ReadingPrefs) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(prefs));
}
