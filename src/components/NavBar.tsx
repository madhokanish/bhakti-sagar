"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Logo from "@/components/Logo";
import AuthModalTrigger from "@/components/auth/AuthModalTrigger";
import HomeLanguageToggle from "@/components/HomeLanguageToggle";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { HOME_LANG_COOKIE, HOME_LANG_STORAGE_KEY, isHomeLang, type HomeLang } from "@/lib/homeCopy";
import { buildBhaktiChatHref } from "@/lib/bhaktigpt/chatLinks";
import { useBhaktiLang } from "@/lib/useBhaktiLang";

const CHAT_LANGUAGE_STORAGE_KEY = "chat_lang";

function readHomeLangCookie() {
  if (typeof document === "undefined") return null;
  const token = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${HOME_LANG_COOKIE}=`));
  if (!token) return null;
  const value = decodeURIComponent(token.split("=")[1] ?? "");
  return isHomeLang(value) ? value : null;
}

function readHomeLangStorage() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(HOME_LANG_STORAGE_KEY);
    return isHomeLang(value) ? value : null;
  } catch {
    return null;
  }
}

function persistHomeLanguage(lang: HomeLang) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOME_LANG_STORAGE_KEY, lang);
    window.localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore localStorage write failures
  }
  document.cookie = `${HOME_LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

const remoteImageLoader = ({ src }: { src: string }) => src;

function isNavItemActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  // Strip query string from href for comparison
  const hrefPath = href.split("?")[0];
  if (hrefPath.includes("/chat")) return pathname.includes("/chat");
  return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
}

export default function NavBar() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [scrolled, setScrolled] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeLang, setHomeLang] = useState<HomeLang>(pathname === "/hi" ? "hi" : "en");
  const headerRef = useRef<HTMLElement | null>(null);
  const { data: session, status } = useSession();
  const callbackUrl = pathname || "/";
  const isChatRoute = pathname?.includes("/chat");
  const isHomepageRoute = pathname === "/" || pathname === "/hi";
  const searchLangRaw = searchParams.get("lang");
  const searchLang = isHomeLang(searchLangRaw) ? searchLangRaw : null;
  const toolsRouteMatch = pathname?.match(/^\/(en|hi)\/(aartis|choghadiya)(?:\/.*)?$/) ?? null;
  const isToolsLocalizedRoute = Boolean(toolsRouteMatch);
  const toolsRouteLocale = (toolsRouteMatch?.[1] as "en" | "hi" | undefined) ?? "en";
  const { lang: storedBhaktiLang, setLang: setBhaktiLang } = useBhaktiLang(toolsRouteLocale === "hi" ? "hi" : "en");
  const toolsToggleLang: HomeLang =
    toolsRouteLocale === "hi" ? "hi" : storedBhaktiLang === "hinglish" ? "hinglish" : "en";
  const effectiveHomeLang: HomeLang = pathname === "/hi" ? "hi" : searchLang ?? homeLang;
  const homeHref = effectiveHomeLang === "hi" ? "/hi" : effectiveHomeLang === "hinglish" ? "/?lang=hinglish" : "/";
  const localePrefix = "/en";
  const chatNavHref = buildBhaktiChatHref({
    guideId: "krishna",
    chatLang: effectiveHomeLang === "en" ? undefined : effectiveHomeLang
  });

  const isAuthenticated = Boolean(session?.user?.id);
  const avatarLabel = session?.user?.name || session?.user?.email || "Account";
  const avatarInitial = avatarLabel.slice(0, 1).toUpperCase();

  const navItems = [
    {
      href: chatNavHref,
      label: t("nav_chat")
    },
    { href: `${localePrefix}/aartis`, label: t("nav_aartis") },
    { href: `${localePrefix}/choghadiya`, label: t("nav_choghadiya") }
  ] as const;

  useEffect(() => {
    if (isChatRoute) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isChatRoute]);

  useLayoutEffect(() => {
    if (isChatRoute) {
      document.documentElement.style.setProperty("--nav-height", "0px");
      return;
    }

    const updateNavHeight = () => {
      const height = headerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--nav-height", `${height}px`);
    };

    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    return () => window.removeEventListener("resize", updateNavHeight);
  }, [isChatRoute]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (pathname === "/hi") {
      setHomeLang("hi");
      return;
    }

    if (pathname === "/" && searchLang) {
      if (searchLang === "hi") {
        router.replace("/hi");
        return;
      }
      setHomeLang(searchLang);
      persistHomeLanguage(searchLang);
      return;
    }

    const cookieLang = readHomeLangCookie();
    const storedLang = readHomeLangStorage();
    const preferredLang = cookieLang ?? storedLang ?? "en";

    if (cookieLang && storedLang !== cookieLang) {
      try {
        window.localStorage.setItem(HOME_LANG_STORAGE_KEY, cookieLang);
        window.localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, cookieLang);
      } catch {
        // ignore localStorage write failures
      }
    } else if (!cookieLang && storedLang) {
      persistHomeLanguage(storedLang);
    }

    setHomeLang(preferredLang);
    if (pathname === "/" && preferredLang === "hi") {
      router.replace("/hi");
    }
  }, [pathname, router, searchLang]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: `${localePrefix}` });
    } finally {
      setIsSigningOut(false);
      setMobileMenuOpen(false);
    }
  }

  function handleHomeLanguageChange(lang: HomeLang) {
    persistHomeLanguage(lang);
    setHomeLang(lang);

    if (lang === "hi") {
      if (pathname !== "/hi") router.replace("/hi");
      return;
    }

    const params = new URLSearchParams(searchParamsKey);
    params.delete("lang");
    if (lang === "hinglish") {
      params.set("lang", "hinglish");
    }
    const query = params.toString();
    router.replace(`/${query ? `?${query}` : ""}`);
  }

  function handleToolsLanguageChange(lang: HomeLang) {
    if (!pathname || !isToolsLocalizedRoute) return;
    setBhaktiLang(lang);

    const qs = searchParams.toString();
    const nextLocale = lang === "hi" ? "hi" : "en";
    const restPath = pathname.replace(/^\/(en|hi)/, "");
    const nextPath = `/${nextLocale}${restPath}${qs ? `?${qs}` : ""}`;
    const currentPath = `${pathname}${qs ? `?${qs}` : ""}`;

    if (nextPath !== currentPath) {
      router.replace(nextPath);
    }
  }

  if (isChatRoute) {
    return null;
  }

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-b border-sagar-amber/20 bg-[#fffdf9]/88 backdrop-blur-xl transition-[box-shadow,background-color] duration-200 ${
        scrolled ? "bg-[#fffdf9]/96 shadow-[0_14px_34px_-30px_rgba(44,20,10,0.7)]" : "shadow-none"
      }`}
    >
      <div className="container relative flex items-center justify-between gap-4 py-3">
        <Logo href={homeHref} />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 rounded-full border border-sagar-amber/25 bg-white/75 px-2 py-1 text-sm font-semibold text-sagar-ink/85 shadow-[0_10px_26px_-24px_rgba(44,20,10,0.65)] md:absolute md:left-1/2 md:flex md:-translate-x-1/2"
        >
          {navItems.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 transition-colors duration-200 ${
                  active
                    ? "bg-sagar-sand/80 text-sagar-ember"
                    : "hover:bg-sagar-sand/55 hover:text-sagar-ember"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isHomepageRoute ? (
            <HomeLanguageToggle currentLang={homeLang} onChange={handleHomeLanguageChange} />
          ) : isToolsLocalizedRoute ? (
            <LanguageToggle currentLang={toolsToggleLang} onChange={handleToolsLanguageChange} compact />
          ) : null}
          <ThemeToggleButton />
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-sagar-cream/80" />
          ) : isAuthenticated ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-sm font-semibold text-sagar-ink/80 shadow-[0_10px_26px_-24px_rgba(44,20,10,0.65)] transition-colors duration-200 hover:border-sagar-amber/55 hover:bg-sagar-sand/40 hover:text-sagar-ink">
                {session?.user?.image ? (
                  <Image
                    loader={remoteImageLoader}
                    unoptimized
                    src={session.user.image}
                    alt={avatarLabel}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full border border-sagar-amber/25 object-cover"
                  />
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sagar-cream text-xs font-semibold text-sagar-ink">
                    {avatarInitial}
                  </span>
                )}
                <span>{t("nav_account")}</span>
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-sagar-ink/55" aria-hidden="true">
                  <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
              </summary>

              <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-sagar-amber/25 bg-[#fffdf9] p-2 text-sm text-sagar-ink/75 shadow-sagar-panel">
                <Link
                  href={`${localePrefix}/profile`}
                  className="mb-1 block rounded-xl px-3 py-2 font-semibold transition-colors duration-200 hover:bg-sagar-cream/65 hover:text-sagar-ember"
                >
                  {t("nav_profile")}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className="block w-full rounded-xl px-3 py-2 text-left font-semibold transition-colors duration-200 hover:bg-sagar-cream/65 hover:text-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? t("nav_logging_out") : t("nav_logout")}
                </button>
              </div>
            </details>
          ) : (
            <AuthModalTrigger
              callbackUrl={callbackUrl}
              className="rounded-full border border-sagar-amber/35 bg-white/90 px-3 py-1.5 text-sm font-semibold text-sagar-ink/80 shadow-[0_10px_26px_-24px_rgba(44,20,10,0.65)] transition-colors duration-200 hover:border-sagar-amber/60 hover:bg-sagar-sand/50 hover:text-sagar-ember"
            >
              {t("nav_login")}
            </AuthModalTrigger>
          )}

        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-sagar-amber/30 bg-white/95 text-sagar-ink/70 shadow-[0_10px_24px_-22px_rgba(44,20,10,0.75)]"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-[#27180f]/40 backdrop-blur-[2px]"
          />
          <div
            id="mobile-nav-drawer"
            className="absolute right-3 top-[calc(var(--nav-height,56px)+8px)] w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-sagar-amber/25 bg-[#fffdf9] p-3 text-sm text-sagar-ink/75 shadow-sagar-panel"
          >
            {isHomepageRoute ? (
              <div className="mb-2 px-1">
                <HomeLanguageToggle currentLang={homeLang} onChange={handleHomeLanguageChange} />
              </div>
            ) : isToolsLocalizedRoute ? (
              <div className="mb-2 px-1">
                <LanguageToggle currentLang={toolsToggleLang} onChange={handleToolsLanguageChange} compact />
              </div>
            ) : null}
            <div className="mb-2 flex items-center justify-end px-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-sagar-ink/65 transition-colors duration-200 hover:bg-sagar-cream/60"
              >
                {t("common_close")}
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <Link
                  href={`${localePrefix}/profile`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-1 block rounded-xl bg-sagar-cream/60 px-3 py-2 font-semibold text-sagar-ink/85 transition-colors duration-200 hover:text-sagar-ember"
                >
                  {t("nav_profile")}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className="mb-2 block w-full rounded-xl bg-sagar-cream/60 px-3 py-2 text-left font-semibold text-sagar-ink/85 transition-colors duration-200 hover:text-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? t("nav_logging_out") : t("nav_logout")}
                </button>
              </>
            ) : (
              <AuthModalTrigger
                callbackUrl={callbackUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="mb-1 block w-full rounded-xl bg-sagar-cream/60 px-3 py-2 text-left font-semibold text-sagar-ink/85 transition-colors duration-200 hover:text-sagar-ember"
              >
                {t("nav_login")}
              </AuthModalTrigger>
            )}

            {navItems.map((item) => {
              const active = isNavItemActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`mb-1 block rounded-xl px-3 py-2 transition-colors duration-200 ${
                    active
                      ? "bg-sagar-sand/80 text-sagar-ember"
                      : "hover:bg-sagar-cream/70 hover:text-sagar-ember"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
