import type { Metadata } from "next";
import SubscribePageClient from "@/components/SubscribePageClient";
import { buildMetadata } from "@/lib/seo";
import { getCurrencyForRequest } from "@/lib/subscription";

export const metadata: Metadata = buildMetadata({
  title: "Start Free Trial | Bhakti Sagar Membership",
  description:
    "Start a 14 day free trial for Bhakti Sagar Membership. Then renew monthly with clear pricing and cancel anytime.",
  pathname: "/subscribe"
});

export default function SubscribePage() {
  const currency = getCurrencyForRequest();

  return (
    <div className="container py-8 md:py-12">
      <SubscribePageClient currency={currency} />
    </div>
  );
}
