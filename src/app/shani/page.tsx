import type { Metadata } from "next";
import DeityHubTemplate from "@/components/seo/DeityHubTemplate";
import { buildHubMetadata } from "@/lib/hindiSeoMetadata";

export function generateMetadata(): Metadata {
  return buildHubMetadata("shani", "en");
}

export default function ShaniHubPage() {
  return <DeityHubTemplate deity="shani" locale="en" />;
}
