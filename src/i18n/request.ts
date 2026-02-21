import { getRequestConfig } from "next-intl/server";
import { headers, cookies } from "next/headers";

const SUPPORTED_LOCALES = ["en", "hi"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && (SUPPORTED_LOCALES as readonly string[]).includes(value));
}

export default getRequestConfig(async () => {
  const headerLocale = headers().get("x-lang");
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  const locale: AppLocale = isLocale(headerLocale)
    ? headerLocale
    : isLocale(cookieLocale)
      ? cookieLocale
      : "en";

  const messages =
    locale === "hi"
      ? (await import("../messages/hi.json")).default
      : (await import("../messages/en.json")).default;

  return { locale, messages };
});

