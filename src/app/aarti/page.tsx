import AartisPage from "@/app/aartis/page";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "All Aartis & Bhajans",
    description: "Browse the full library of aartis and bhajans with English and Hindi lyrics.",
    pathname: "/aartis"
  })
};

export default function AartiAliasPage(props: Parameters<typeof AartisPage>[0]) {
  return <AartisPage {...props} />;
}
