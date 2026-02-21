"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

type Locale = "en" | "hi";

function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment === "hi" ? "hi" : "en";
}

function swapLocale(pathname: string, next: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${next}`;
  if (parts[0] === "en" || parts[0] === "hi") {
    parts[0] = next;
    return `/${parts.join("/")}`;
  }
  return `/${next}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

function setLocaleCookie(locale: Locale) {
  const maxAgeSeconds = 60 * 60 * 24 * 365;
  document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export default function LanguageToggle() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const active: Locale = locale === "hi" ? "hi" : getLocaleFromPath(pathname);
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-sagar-amber/30 bg-white px-1 py-1 text-xs font-semibold text-sagar-ink/75">
      <button
        type="button"
        onClick={() => {
          if (active === "en") return;
          setLocaleCookie("en");
          router.push(`${swapLocale(pathname, "en")}${search}`);
        }}
        className={`rounded-full px-2.5 py-1 transition ${
          active === "en" ? "bg-sagar-cream text-sagar-ink" : "hover:bg-sagar-cream/60"
        }`}
        aria-pressed={active === "en"}
      >
        EN
      </button>
      <span className="px-0.5 text-sagar-ink/40">|</span>
      <button
        type="button"
        onClick={() => {
          if (active === "hi") return;
          setLocaleCookie("hi");
          router.push(`${swapLocale(pathname, "hi")}${search}`);
        }}
        className={`rounded-full px-2.5 py-1 transition ${
          active === "hi" ? "bg-sagar-cream text-sagar-ink" : "hover:bg-sagar-cream/60"
        }`}
        aria-pressed={active === "hi"}
      >
        हिंदी
      </button>
    </div>
  );
}
