import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ChoghadiyaPage } from "@/app/choghadiya/ChoghadiyaPage";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { buildChoghadiyaMetadata } from "@/lib/choghadiyaSeo";
import { findCityBySlug } from "@/lib/choghadiyaCities";
import { notFound } from "next/navigation";
import { HOME_LANG_COOKIE, resolveHomeLang } from "@/lib/homeCopy";

export function generateMetadata({
  params,
  searchParams
}: {
  params: { citySlug: string };
  searchParams?: SearchParams;
}): Metadata {
  const pathnameBase = `/choghadiya/${params.citySlug}`;
  const state = resolveChoghadiyaState({ params, searchParams, pathnameBase });
  return buildChoghadiyaMetadata(state);
}

export default function Page({
  params,
  searchParams
}: {
  params: { citySlug: string };
  searchParams?: SearchParams;
}) {
  if (!findCityBySlug(params.citySlug)) {
    notFound();
  }
  return (
    <ChoghadiyaPage
      params={params}
      pathnameBase={`/choghadiya/${params.citySlug}`}
      searchParams={searchParams}
      routeLocale="en"
      initialLang={resolveHomeLang(cookies().get(HOME_LANG_COOKIE)?.value, "en")}
    />
  );
}
