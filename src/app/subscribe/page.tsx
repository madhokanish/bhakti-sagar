import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getCurrencyForRequest } from "@/lib/subscription";
import SubscribePageClient from "@/components/SubscribePageClient";

export const metadata: Metadata = buildMetadata({
  title: "Bhakti Chat Membership",
  description:
    "Start your Bhakti Chat membership with secure checkout.",
  pathname: "/subscribe"
});

export default function SubscribePage() {
  const initialCurrency = getCurrencyForRequest();

  return (
    <div className="container py-8 md:py-12">
      <section className="mb-6 rounded-[2rem] border border-sagar-amber/20 bg-gradient-to-br from-white via-sagar-cream/60 to-sagar-sand/65 p-6 shadow-sagar-soft md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Membership</p>
        <h1 className="mt-2 text-4xl font-serif text-sagar-ink md:text-5xl">Support your daily devotion</h1>
        <p className="mt-3 max-w-3xl text-sm text-sagar-ink/74 md:text-base">
          Continue with secure checkout and manage your subscription anytime from billing settings.
        </p>
      </section>

      <SubscribePageClient currency={initialCurrency} />
    </div>
  );
}
