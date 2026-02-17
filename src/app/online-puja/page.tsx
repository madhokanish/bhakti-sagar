import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { WEEKLY_PLANS } from "@/app/online-puja/plans";
import { DEITY_NAMES } from "@/lib/terminology";
import PujaListingPage from "@/components/online-puja/PujaListingPage";

export const metadata: Metadata = buildMetadata({
  title: "Online Puja Membership | Lord Ganesh Puja & Shani Dev Puja",
  description:
    `Join online puja memberships for ${DEITY_NAMES.ganesh.heading} Puja and ${DEITY_NAMES.shani.heading} Puja. Weekly sankalp includes your name and gotra, with live access, replay, and certificate updates.`,
  pathname: "/online-puja",
  keywords: [
    "online puja",
    "shani dev puja",
    "ganesh puja",
    "weekly online puja",
    "online puja membership"
  ]
});

export default async function OnlinePujaIndexPage() {
  const supportEmail = "support@bhakti-sagar.com";
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Online Puja", url: "https://bhakti-sagar.com/online-puja" }
  ]);
  const faqItems = [
    {
      q: "How can I join online puja for Shani Dev or Lord Ganesh?",
      a: "Open the plan page, add your details once, and continue to membership checkout."
    },
    {
      q: "What does in your name mean?",
      a: "Your name and gotra are included in sankalp recitation during the ritual."
    },
    {
      q: "What if I miss the live puja?",
      a: "Replay access is included so you can watch later."
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Membership can be managed from billing settings."
    },
    {
      q: "Can I join online puja from outside India?",
      a: "Yes. We show the schedule in your local timezone with IST reference."
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
      url: `https://bhakti-sagar.com/online-puja/${plan.slug}`
    }
  }));

  return (
    <>
      <PujaListingPage supportEmail={supportEmail} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
    </>
  );
}
