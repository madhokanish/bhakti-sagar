import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChoghadiyaPage } from "@/app/choghadiya/ChoghadiyaPage";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { buildChoghadiyaMetadata } from "@/lib/choghadiyaSeo";
import { findCityBySlug } from "@/lib/choghadiyaCities";

export function generateMetadata({
  params,
  searchParams
}: {
  params: { citySlug: string };
  searchParams?: SearchParams;
}): Metadata {
  const pathnameBase = `/hi/choghadiya/${params.citySlug}`;
  const state = resolveChoghadiyaState({ params, searchParams, pathnameBase });

  return buildChoghadiyaMetadata({
    cityLabel: state.cityLabel,
    dateLabel: state.dateLabel,
    canonicalUrl: state.canonicalUrl,
    locale: "hi"
  });
}

export default function HiCityChoghadiyaPage({
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
      pathnameBase={`/hi/choghadiya/${params.citySlug}`}
      searchParams={searchParams}
      routeLocale="hi"
      initialLang="hi"
    />
  );
}
