import AartisPage from "@/app/aartis/page";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: toTitle("All Aartis & Bhajans"),
  description: toDescription("Browse the full library of aartis and bhajans with English and Hindi lyrics."),
  alternates: {
    canonical: "https://bhakti-sagar.com/aartis"
  }
};

export default function AartiAliasPage(props: Parameters<typeof AartisPage>[0]) {
  return <AartisPage {...props} />;
}
