import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeLyricLine,
  buildVerseCopyText,
  buildFullCopyText,
  loadReadingPrefs,
  saveReadingPrefs,
  defaultReadingPrefs
} from "../src/lib/reading.ts";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

test("sanitizeLyricLine removes trailing question marks", () => {
  assert.equal(sanitizeLyricLine("Jai Ganesh?"), "Jai Ganesh");
  assert.equal(sanitizeLyricLine("Jai Ganesh ? "), "Jai Ganesh");
  assert.equal(sanitizeLyricLine("Jai Ganesh."), "Jai Ganesh.");
});

test("copy payloads are formatted correctly", () => {
  const verse = buildVerseCopyText({
    title: "Ganesh Ji Ki Aarti",
    verse: "Jai Ganesh, Jai Ganesh",
    url: "https://bhakti-sagar.com/aartis/ganesh"
  });
  assert.equal(
    verse,
    "Ganesh Ji Ki Aarti\nJai Ganesh, Jai Ganesh\nhttps://bhakti-sagar.com/aartis/ganesh"
  );

  const full = buildFullCopyText({
    title: "Ganesh Ji Ki Aarti",
    verses: ["Jai Ganesh", "Mata Jaaki"],
    url: "https://bhakti-sagar.com/aartis/ganesh"
  });
  assert.equal(
    full,
    "Ganesh Ji Ki Aarti\n\nJai Ganesh\nMata Jaaki\n\nhttps://bhakti-sagar.com/aartis/ganesh"
  );
});

test("reading prefs persist and merge with defaults", () => {
  const storage = new MemoryStorage();
  saveReadingPrefs(storage as unknown as Storage, "prefs", {
    ...defaultReadingPrefs,
    fontSize: 20,
    language: "hindi"
  });
  const loaded = loadReadingPrefs(storage as unknown as Storage, "prefs");
  assert.equal(loaded.fontSize, 20);
  assert.equal(loaded.language, "hindi");
  assert.equal(loaded.lineHeight, defaultReadingPrefs.lineHeight);
});
