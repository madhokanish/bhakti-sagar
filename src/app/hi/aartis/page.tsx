import type { Metadata } from "next";
import { getAartis, searchAartis } from "@/lib/data";
import LocalizedAartisContent from "@/components/aartis/LocalizedAartisContent";
import { AARTIS_COPY } from "@/lib/aartisCopy";
import { buildMetadata } from "@/lib/seo";

export function generateMetadata({
  searchParams
}: {
  searchParams?: { q?: string };
}): Metadata {
  const query = searchParams?.q?.trim();

  return buildMetadata({
    title: AARTIS_COPY.hi.page_title,
    description: "सभी आरती और भजन एक जगह पढ़ें, खोजें और दैनिक भक्ति अभ्यास के लिए उपयोग करें।",
    pathname: "/hi/aartis",
    noindex: Boolean(query)
  });
}

export default function HiAartisPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = searchParams?.q ?? "";
  const results = query ? searchAartis(query) : getAartis();

  return <LocalizedAartisContent results={results} query={query} routeLocale="hi" formAction="/hi/aartis" />;
}
