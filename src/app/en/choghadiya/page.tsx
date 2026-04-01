import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ChoghadiyaPage } from "@/app/choghadiya/ChoghadiyaPage";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { buildChoghadiyaMetadata } from "@/lib/choghadiyaSeo";
import { HOME_LANG_COOKIE, resolveHomeLang } from "@/lib/homeCopy";

export function generateMetadata({ searchParams }: { searchParams?: SearchParams }): Metadata {
  const state = resolveChoghadiyaState({
    searchParams,
    pathnameBase: "/en/choghadiya"
  });
  const selectedLang = resolveHomeLang(cookies().get(HOME_LANG_COOKIE)?.value, "en");

  return buildChoghadiyaMetadata({
    cityLabel: state.cityLabel,
    dateLabel: state.dateLabel,
    canonicalUrl: state.canonicalUrl,
    locale: "en",
    noindex: selectedLang === "hinglish"
  });
}

export default function EnChoghadiyaPage({ searchParams }: { searchParams?: SearchParams }) {
  const selectedLang = resolveHomeLang(cookies().get(HOME_LANG_COOKIE)?.value, "en");

  return (
    <ChoghadiyaPage
      pathnameBase="/en/choghadiya"
      searchParams={searchParams}
      routeLocale="en"
      initialLang={selectedLang}
    />
  );
}
