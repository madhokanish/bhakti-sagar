"use client";

import { useCallback, useEffect, useState } from "react";

export type BookmarkStore = { messages: string[]; aartis: string[] };
const KEY = "bhakti_bookmarks";
const EVENT = "bhakti_bookmarks_changed";

const emptyStore = (): BookmarkStore => ({ messages: [], aartis: [] });

export function loadBookmarks(): BookmarkStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return {
      messages: Array.isArray(parsed?.messages) ? parsed.messages : [],
      aartis: Array.isArray(parsed?.aartis) ? parsed.aartis : []
    };
  } catch {
    return emptyStore();
  }
}

export function saveBookmarks(s: BookmarkStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    // ignore
  }
}

export function toggleMessageBookmark(id: string): boolean {
  const s = loadBookmarks();
  const idx = s.messages.indexOf(id);
  if (idx >= 0) s.messages.splice(idx, 1);
  else s.messages.push(id);
  saveBookmarks(s);
  return s.messages.includes(id);
}

export function toggleAartiBookmark(slug: string): boolean {
  const s = loadBookmarks();
  const idx = s.aartis.indexOf(slug);
  if (idx >= 0) s.aartis.splice(idx, 1);
  else s.aartis.push(slug);
  saveBookmarks(s);
  return s.aartis.includes(slug);
}

export function isMessageBookmarked(id: string): boolean {
  return loadBookmarks().messages.includes(id);
}

export function isAartiBookmarked(slug: string): boolean {
  return loadBookmarks().aartis.includes(slug);
}

export function useBookmarks(): {
  bookmarks: BookmarkStore;
  toggleMessage: (id: string) => void;
  toggleAarti: (slug: string) => void;
  hasMessage: (id: string) => boolean;
  hasAarti: (slug: string) => boolean;
} {
  const [bookmarks, setBookmarks] = useState<BookmarkStore>(emptyStore);

  useEffect(() => {
    setBookmarks(loadBookmarks());
    const refresh = () => setBookmarks(loadBookmarks());
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const toggleMessage = useCallback((id: string) => {
    toggleMessageBookmark(id);
  }, []);
  const toggleAarti = useCallback((slug: string) => {
    toggleAartiBookmark(slug);
  }, []);
  const hasMessage = useCallback((id: string) => bookmarks.messages.includes(id), [bookmarks]);
  const hasAarti = useCallback((slug: string) => bookmarks.aartis.includes(slug), [bookmarks]);

  return { bookmarks, toggleMessage, toggleAarti, hasMessage, hasAarti };
}
