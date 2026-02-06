import type { Metadata } from "next";
import { ChoghadiyaPage } from "@/app/choghadiya/ChoghadiyaPage";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { buildChoghadiyaMetadata } from "@/lib/choghadiyaSeo";
import { findCityBySlug } from "@/lib/choghadiyaCities";
import { notFound } from "next/navigation";

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
    />
  );
}
