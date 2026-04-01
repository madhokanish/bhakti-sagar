export const SITE_URL = "https://bhaktichat.com";

export const LOCALES = {
  en: "",
  hi: "/hi"
} as const;

export type LocaleKey = keyof typeof LOCALES;

export function buildUrl(locale: LocaleKey, path = "/") {
  const localePrefix = LOCALES[locale];
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const suffix = normalizedPath === "/" ? "" : normalizedPath;
  return `${SITE_URL}${localePrefix}${suffix}`;
}
