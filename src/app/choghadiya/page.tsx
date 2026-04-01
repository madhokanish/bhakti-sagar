import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ChoghadiyaPage } from "@/app/choghadiya/ChoghadiyaPage";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { buildChoghadiyaMetadata } from "@/lib/choghadiyaSeo";
import { HOME_LANG_COOKIE, resolveHomeLang } from "@/lib/homeCopy";

export function generateMetadata({ searchParams }: { searchParams?: SearchParams }): Metadata {
  const state = resolveChoghadiyaState({
    searchParams,
    pathnameBase: "/choghadiya"
  });
  return buildChoghadiyaMetadata(state);
}

export default function Page({ searchParams }: { searchParams?: SearchParams }) {
  const selectedLang = resolveHomeLang(cookies().get(HOME_LANG_COOKIE)?.value, "en");
  return (
    <ChoghadiyaPage
      pathnameBase="/choghadiya"
      searchParams={searchParams}
      routeLocale="en"
      initialLang={selectedLang}
    />
  );
}
