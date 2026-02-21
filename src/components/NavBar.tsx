"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Logo from "@/components/Logo";
import AuthModalTrigger from "@/components/auth/AuthModalTrigger";

export default function NavBar() {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const callbackUrl = pathname || "/";
  const isChatRoute = pathname?.includes("/bhaktigpt/chat");
  const localePrefix = "/en";

  const isAuthenticated = Boolean(session?.user?.id);
  const avatarLabel = session?.user?.name || session?.user?.email || "Account";
  const avatarInitial = avatarLabel.slice(0, 1).toUpperCase();

  const navItems = [
    {
      href: `${localePrefix}/bhaktigpt/chat?guide=krishna`,
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

  if (isChatRoute) {
    return null;
  }

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-b border-sagar-amber/18 bg-white/90 backdrop-blur transition-shadow ${
        scrolled ? "shadow-[0_10px_30px_-24px_rgba(44,20,10,0.5)]" : "shadow-none"
      }`}
    >
      <div className="container relative flex items-center justify-between gap-4 py-2.5">
        <Logo href={localePrefix} />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 text-sm font-semibold text-sagar-ink/85 md:absolute md:left-1/2 md:flex md:-translate-x-1/2"
        >
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-sagar-ember">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-sagar-cream/70" />
          ) : isAuthenticated ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-sagar-amber/30 bg-white px-2 py-1 text-sm font-semibold text-sagar-ink/80 transition hover:border-sagar-amber/55 hover:text-sagar-ink">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={avatarLabel}
                    className="h-7 w-7 rounded-full border border-sagar-amber/25 object-cover"
                  />
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sagar-cream text-xs font-semibold text-sagar-ink">
                    {avatarInitial}
                  </span>
                )}
                <span>Account</span>
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-sagar-ink/55" aria-hidden="true">
                  <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
              </summary>

              <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-sagar-amber/20 bg-white p-2 text-sm text-sagar-ink/75 shadow-sagar-soft">
                <Link
                  href={`${localePrefix}/profile`}
                  className="mb-1 block rounded-xl px-3 py-2 font-semibold transition hover:bg-sagar-cream/65 hover:text-sagar-ember"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className="block w-full rounded-xl px-3 py-2 text-left font-semibold transition hover:bg-sagar-cream/65 hover:text-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </details>
          ) : (
            <AuthModalTrigger
              callbackUrl={callbackUrl}
              className="rounded-full border border-sagar-amber/35 px-3 py-1.5 text-sm font-semibold text-sagar-ink/80 transition hover:border-sagar-amber/60 hover:text-sagar-ember"
            >
              {t("nav_login")}
            </AuthModalTrigger>
          )}

        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-sagar-amber/30 bg-white text-sagar-ink/70"
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
            className="absolute inset-0 bg-black/35"
          />
          <div
            id="mobile-nav-drawer"
            className="absolute right-4 top-[calc(var(--nav-height,56px)+8px)] w-64 rounded-2xl border border-sagar-amber/20 bg-white p-3 text-sm text-sagar-ink/75 shadow-sagar-soft"
          >
            <div className="mb-2 flex items-center justify-end px-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-sagar-ink/65 hover:bg-sagar-cream/60"
              >
                {t("common_close")}
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <Link
                  href={`${localePrefix}/profile`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-1 block rounded-xl bg-sagar-cream/60 px-3 py-2 font-semibold text-sagar-ink/85 transition hover:text-sagar-ember"
                >
                  {t("nav_profile")}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className="mb-2 block w-full rounded-xl bg-sagar-cream/60 px-3 py-2 text-left font-semibold text-sagar-ink/85 transition hover:text-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? t("nav_logging_out") : t("nav_logout")}
                </button>
              </>
            ) : (
              <AuthModalTrigger
                callbackUrl={callbackUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="mb-1 block w-full rounded-xl bg-sagar-cream/60 px-3 py-2 text-left font-semibold text-sagar-ink/85 transition hover:text-sagar-ember"
              >
                {t("nav_login")}
              </AuthModalTrigger>
            )}

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="mb-1 block rounded-xl px-3 py-2 transition hover:bg-sagar-cream/70 hover:text-sagar-ember"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
