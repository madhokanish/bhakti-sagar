import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { getCurrencyForRequest } from "@/lib/subscription";
import ShaniWeeklyMembershipView from "@/components/online-puja/ShaniWeeklyMembershipPage";
import { getPlanById } from "@/app/online-puja/plans";

export const metadata: Metadata = buildMetadata({
  title: "Weekly Shani Membership (Saturday Puja)",
  description:
    "Join Weekly Shani Membership for Saturday puja. 4 pujas per month in your name with live access, replay, and certificate.",
  pathname: "/online-puja/shani-weekly"
});

export default function ShaniWeeklyMembershipPage() {
  const plan = getPlanById("shani");
  const currency = getCurrencyForRequest();

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Online Puja", url: "https://bhakti-sagar.com/online-puja" },
    { name: "Shani Weekly Membership", url: "https://bhakti-sagar.com/online-puja/shani-weekly" }
  ]);

  const faq = faqJsonLd([
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
    }
  ]);

  return (
    <>
      <ShaniWeeklyMembershipView plan={plan} currency={currency} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}
