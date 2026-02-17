import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { getCurrencyForRequest } from "@/lib/subscription";
import { DEITY_NAMES } from "@/lib/terminology";
import ShaniWeeklyMembershipView from "@/components/online-puja/ShaniWeeklyMembershipPage";
import { getPlanById } from "@/app/online-puja/plans";

export const metadata: Metadata = buildMetadata({
  title: `${DEITY_NAMES.shani.heading} Puja Online Every Saturday | Weekly Membership`,
  description:
    `Join ${DEITY_NAMES.shani.heading} Puja online every Saturday. 4 pujas per month in your name with live darshan access, replay, and certificate.`,
  pathname: "/online-puja/shani-weekly",
  keywords: [
    "shani dev puja",
    "shani puja online",
    "online puja for shani dev",
    "weekly shani dev puja"
  ]
});

export default function ShaniWeeklyMembershipPage() {
  const plan = getPlanById("shani");
  const currency = getCurrencyForRequest();

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Online Puja", url: "https://bhakti-sagar.com/online-puja" },
    { name: `${DEITY_NAMES.shani.heading} Puja`, url: "https://bhakti-sagar.com/online-puja/shani-weekly" }
  ]);

  const faq = faqJsonLd([
    {
      q: `What is ${DEITY_NAMES.shani.heading} Puja online membership?`,
      a: "It is a weekly Saturday ritual with sankalp in your name, live access, replay, and certificate updates."
    },
    {
      q: "What does in your name mean?",
      a: "Your name is included in sankalp recitation every Saturday as part of the weekly ritual."
    },
    {
      q: "Do I need to attend live?",
      a: "No. Replay is available if you miss the live session."
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Membership can be managed from billing settings."
    },
    {
      q: "Is this available outside India?",
      a: "Yes. Timing is shown in your local timezone with IST reference."
    },
    {
      q: "How is this different from one-time online puja booking?",
      a: "This plan includes 4 weekly pujas every month, so your name is included automatically each week."
    }
  ]);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${DEITY_NAMES.shani.heading} Puja Online Weekly Membership`,
    description:
      "Weekly Shani Dev Puja membership with sankalp in your name, live darshan access, replay, and certificate.",
    image: `https://bhakti-sagar.com${plan.heroImage}`,
    brand: { "@type": "Brand", name: "Bhakti Sagar" },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: plan.priceMonthly.GBP.toFixed(2),
      availability: "https://schema.org/InStock",
      url: "https://bhakti-sagar.com/online-puja/shani-weekly"
    }
  };

  return (
    <>
      <ShaniWeeklyMembershipView plan={plan} currency={currency} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
    </>
  );
}
