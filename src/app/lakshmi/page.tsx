import type { Metadata } from "next";
import DeityHubTemplate from "@/components/seo/DeityHubTemplate";
import { buildHubMetadata } from "@/lib/hindiSeoMetadata";
import { getRequestLanguage } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const locale = getRequestLanguage();
  return buildHubMetadata("lakshmi", locale);
}

export default function LakshmiHubPage() {
  const locale = getRequestLanguage();
  return <DeityHubTemplate deity="lakshmi" locale={locale} />;
}
