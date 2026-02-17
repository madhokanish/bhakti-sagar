import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { getCurrencyForRequest } from "@/lib/subscription";
import { DEITY_NAMES } from "@/lib/terminology";
import MembershipPlanPage from "@/components/online-puja/MembershipPlanPage";
import { getPlanById } from "@/app/online-puja/plans";

export const metadata: Metadata = buildMetadata({
  title: `${DEITY_NAMES.ganesh.heading} Puja Online Every Wednesday | Weekly Membership`,
  description:
    `Join ${DEITY_NAMES.ganesh.heading} Puja online every Wednesday. 4 pujas per month in your name with live darshan access, replay, and certificate.`,
  pathname: "/online-puja/ganesh-weekly",
  keywords: [
    "lord ganesh puja",
    "ganesh ji puja online",
    "online puja for ganesh",
    "weekly ganesh puja"
  ]
});

export default function GaneshWeeklyMembershipPage() {
  const plan = getPlanById("ganesh");
  const currency = getCurrencyForRequest();

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Online Puja", url: "https://bhakti-sagar.com/online-puja" },
    { name: `${DEITY_NAMES.ganesh.heading} Weekly Membership`, url: "https://bhakti-sagar.com/online-puja/ganesh-weekly" }
  ]);

  const faq = faqJsonLd([
    {
      q: `What is ${DEITY_NAMES.ganesh.heading} Puja online membership?`,
      a: `It is a weekly Wednesday ritual where your name is included in sankalp, with live access and replay support.`
    },
    {
      q: "What does in your name mean?",
      a: "Your name is included in sankalp recitation during the weekly ritual."
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
      q: "Can I join Lord Ganesh Puja online from UK, USA, or Canada?",
      a: "Yes. The puja is available globally and timings are shown in your local timezone."
    }
  ]);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${DEITY_NAMES.ganesh.heading} Puja Online Weekly Membership`,
    description:
      "Weekly Lord Ganesh Puja membership with sankalp in your name, live darshan access, replay, and certificate.",
    image: `https://bhakti-sagar.com${plan.heroImage}`,
    brand: { "@type": "Brand", name: "Bhakti Sagar" },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: plan.priceMonthly.GBP.toFixed(2),
      availability: "https://schema.org/InStock",
      url: "https://bhakti-sagar.com/online-puja/ganesh-weekly"
    }
  };

  return (
    <>
      <MembershipPlanPage plan={plan} currency={currency} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
    </>
  );
}
