import type { Metadata } from "next";
import { ChoghadiyaPage } from "@/app/choghadiya/ChoghadiyaPage";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { buildChoghadiyaMetadata } from "@/lib/choghadiyaSeo";

export function generateMetadata({ searchParams }: { searchParams?: SearchParams }): Metadata {
  const state = resolveChoghadiyaState({
    searchParams,
    pathnameBase: "/hi/choghadiya"
  });

  return buildChoghadiyaMetadata({
    cityLabel: state.cityLabel,
    dateLabel: state.dateLabel,
    canonicalUrl: state.canonicalUrl,
    locale: "hi"
  });
}

export default function HiChoghadiyaPage({ searchParams }: { searchParams?: SearchParams }) {
  return (
    <ChoghadiyaPage
      pathnameBase="/hi/choghadiya"
      searchParams={searchParams}
      routeLocale="hi"
      initialLang="hi"
    />
  );
}
