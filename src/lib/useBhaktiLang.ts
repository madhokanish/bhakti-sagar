"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HOME_LANG_COOKIE, HOME_LANG_STORAGE_KEY, isHomeLang, type HomeLang } from "@/lib/homeCopy";

const CHANGE_EVENT = "bhakti-lang-change";
const CHAT_LANG_STORAGE_KEY = "chat_lang";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const token = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!token) return null;
  return decodeURIComponent(token.slice(name.length + 1));
}

function broadcastLanguage(lang: HomeLang) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<HomeLang>(CHANGE_EVENT, { detail: lang }));
}

export function setBhaktiLangPreference(lang: HomeLang) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HOME_LANG_STORAGE_KEY, lang);
    window.localStorage.setItem(CHAT_LANG_STORAGE_KEY, lang);
  } catch {
    // ignore localStorage failures
  }

  document.cookie = `${HOME_LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  broadcastLanguage(lang);
}

export function useBhaktiLang(initialLang: HomeLang) {
  const [lang, setLangState] = useState<HomeLang>(initialLang);
  const reconciledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reconciledRef.current) return;
    reconciledRef.current = true;

    let storedLang: HomeLang | null = null;
    try {
      const raw = window.localStorage.getItem(HOME_LANG_STORAGE_KEY);
      storedLang = isHomeLang(raw) ? raw : null;
    } catch {
      storedLang = null;
    }

    const cookieLangRaw = readCookie(HOME_LANG_COOKIE);
    const cookieLang = isHomeLang(cookieLangRaw) ? cookieLangRaw : null;
    const preferredLang = storedLang ?? cookieLang;

    if (!preferredLang) {
      setBhaktiLangPreference(initialLang);
      return;
    }

    if (preferredLang !== lang) {
      setLangState(preferredLang);
    }

    if (!cookieLang || cookieLang !== preferredLang) {
      setBhaktiLangPreference(preferredLang);
    }
  }, [initialLang, lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== HOME_LANG_STORAGE_KEY) return;
      if (!isHomeLang(event.newValue)) return;
      setLangState(event.newValue);
    };

    const handleChange = (event: Event) => {
      const next = (event as CustomEvent<HomeLang>).detail;
      if (!isHomeLang(next)) return;
      setLangState(next);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CHANGE_EVENT, handleChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CHANGE_EVENT, handleChange as EventListener);
    };
  }, []);

  const setLang = useCallback((next: HomeLang) => {
    if (!isHomeLang(next)) return;
    setLangState(next);
    setBhaktiLangPreference(next);
  }, []);

  return { lang, setLang };
}

export function useHinglishNoindex(lang: HomeLang) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const id = "bhakti-hinglish-noindex";
    const existing = document.head.querySelector<HTMLMetaElement>(`meta[data-bhakti-noindex=\"${id}\"]`);

    if (lang === "hinglish") {
      if (existing) {
        existing.setAttribute("content", "noindex,follow");
      } else {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "robots");
        meta.setAttribute("content", "noindex,follow");
        meta.setAttribute("data-bhakti-noindex", id);
        document.head.appendChild(meta);
      }
      return;
    }

    if (existing) {
      existing.remove();
    }
  }, [lang]);
}
