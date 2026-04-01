import type { Metadata } from "next";
import DeityHubTemplate from "@/components/seo/DeityHubTemplate";
import { buildHubMetadata } from "@/lib/hindiSeoMetadata";

export function generateMetadata(): Metadata {
  return buildHubMetadata("lakshmi", "en");
}

export default function LakshmiHubPage() {
  return <DeityHubTemplate deity="lakshmi" locale="en" />;
}
