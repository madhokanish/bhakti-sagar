import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { onlinePujas } from "@/lib/onlinePuja";
import PujaListingPage from "@/components/online-puja/PujaListingPage";

export const metadata: Metadata = buildMetadata({
  title: "Online Puja Seva",
  description:
    "Book weekly online puja seva with temple-led rituals. View Ganesh and Hanuman puja details, pricing, and checkout in minutes.",
  pathname: "/online-puja"
});

export default async function OnlinePujaIndexPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Online Puja", url: "https://bhakti-sagar.com/online-puja" }
  ]);
  const faq = faqJsonLd([
    {
      q: "What is Online Puja on Bhakti Sagar?",
      a: "Online Puja lets you book recurring weekly temple sevas from home with clear schedules and devotional guidance."
    },
    {
      q: "Do I need to pay online right now?",
      a: "Selected sevas may have direct booking enabled. If payment is temporarily unavailable, you can still submit a reservation request."
    },
    {
      q: "How does the countdown work?",
      a: "Each puja runs on a weekly cycle. The countdown always targets the next scheduled weekday and resets every week."
    }
  ]);

  return (
    <>
      <PujaListingPage
        pujas={onlinePujas}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}
