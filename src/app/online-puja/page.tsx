import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { onlinePujas } from "@/lib/onlinePuja";
import { WEEKLY_PLANS } from "@/app/online-puja/plans";
import { getCurrencyForRequest } from "@/lib/subscription";
import PujaListingPage from "@/components/online-puja/PujaListingPage";

export const metadata: Metadata = buildMetadata({
  title: "Weekly Online Puja Membership",
  description:
    "Join Weekly Ganesh and Shani Online Puja Membership. Name included weekly, live access, replay included, and cancel anytime.",
  pathname: "/online-puja"
});

export default async function OnlinePujaIndexPage() {
  const initialCurrency = getCurrencyForRequest();
  const secondaryPujas = onlinePujas.filter((item) => item.slug !== "ganesh-vighnaharta");
  const supportEmail = "support@bhakti-sagar.com";
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Online Puja", url: "https://bhakti-sagar.com/online-puja" }
  ]);
  const faqItems = [
    {
      q: "What does in your name mean?",
      a: "Your name is included in sankalp recitation during the ritual."
    },
    {
      q: "What if I miss the live puja?",
      a: "Replay access is included so you can watch later."
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Membership can be managed from billing settings."
    }
  ];
  const faq = faqJsonLd(faqItems);
  const productSchema = WEEKLY_PLANS.map((plan) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: plan.title,
    description: plan.traditionalNote,
    image: `https://bhakti-sagar.com${plan.heroImage}`,
    brand: { "@type": "Brand", name: "Bhakti Sagar" },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: plan.priceMonthly.GBP.toFixed(2),
      availability: "https://schema.org/InStock",
      url: `https://bhakti-sagar.com/subscribe?plan=${plan.id}&mode=monthly`
    }
  }));

  return (
    <>
      <PujaListingPage
        initialCurrency={initialCurrency}
        secondaryPujas={secondaryPujas}
        supportEmail={supportEmail}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
    </>
  );
}
