import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SubscribePageClient from "@/components/SubscribePageClient";
import { getCurrencyForRequest } from "@/lib/subscription";

export const metadata: Metadata = buildMetadata({
  title: "Manage Subscription | Bhakti Sagar",
  description:
    "Manage your Bhakti Sagar membership billing, payment methods, and cancellation via Stripe Customer Portal.",
  pathname: "/manage-subscription"
});

export default function ManageSubscriptionPage() {
  const currency = getCurrencyForRequest();

  return (
    <div className="container py-8 md:py-12">
      <SubscribePageClient currency={currency} />
    </div>
  );
}
