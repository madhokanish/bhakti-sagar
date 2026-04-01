import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAartis, searchAartis } from "@/lib/data";
import LocalizedAartisContent from "@/components/aartis/LocalizedAartisContent";
import { AARTIS_COPY } from "@/lib/aartisCopy";
import { HOME_LANG_COOKIE, resolveHomeLang } from "@/lib/homeCopy";
import { buildMetadata } from "@/lib/seo";

export function generateMetadata({
  searchParams
}: {
  searchParams?: { q?: string };
}): Metadata {
  const cookieStore = cookies();
  const selectedLang = resolveHomeLang(cookieStore.get(HOME_LANG_COOKIE)?.value, "en");
  const query = searchParams?.q?.trim();

  return buildMetadata({
    title: AARTIS_COPY.en.page_title,
    description: "Browse devotional aartis and bhajans with trusted lyrics and daily reflection support.",
    pathname: "/en/aartis",
    noindex: Boolean(query) || selectedLang === "hinglish"
  });
}

export default function EnAartisPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = searchParams?.q ?? "";
  const results = query ? searchAartis(query) : getAartis();

  return <LocalizedAartisContent results={results} query={query} routeLocale="en" formAction="/en/aartis" />;
}
