import type { Metadata } from "next";
import { ChoghadiyaPage } from "@/app/choghadiya/ChoghadiyaPage";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { buildChoghadiyaMetadata } from "@/lib/choghadiyaSeo";

export function generateMetadata({ searchParams }: { searchParams?: SearchParams }): Metadata {
  const state = resolveChoghadiyaState({
    searchParams,
    pathnameBase: "/choghadiya"
  });
  return buildChoghadiyaMetadata(state);
}

export default function Page({ searchParams }: { searchParams?: SearchParams }) {
  return <ChoghadiyaPage pathnameBase="/choghadiya" searchParams={searchParams} />;
}
