import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { getActiveOnlinePujas, getOnlinePujaBySlug } from "@/lib/onlinePuja";
import PujaDetailPage from "@/components/online-puja/PujaDetailPage";

export function generateStaticParams() {
  return getActiveOnlinePujas().map((puja) => ({ slug: puja.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const puja = getOnlinePujaBySlug(params.slug);
  if (!puja || !puja.isActive) {
    return buildMetadata({
      title: "Online Puja",
      description: "Weekly online puja seva details.",
      pathname: `/online-puja/${params.slug}`
    });
  }

  return buildMetadata({
    title: puja.seo.title,
    description: puja.seo.description,
    pathname: `/online-puja/${puja.slug}`
  });
}

export default function OnlinePujaDetailRoute({ params }: { params: { slug: string } }) {
  const puja = getOnlinePujaBySlug(params.slug);
  if (!puja || !puja.isActive) {
    notFound();
  }

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Online Puja", url: "https://bhakti-sagar.com/online-puja" },
    { name: puja.title, url: `https://bhakti-sagar.com/online-puja/${puja.slug}` }
  ]);

  const faq = faqJsonLd([
    {
      q: `When is ${puja.title} conducted?`,
      a: `${puja.title} is scheduled every ${puja.weeklyDay}. The countdown always points to the next cycle.`
    },
    {
      q: "How do I join this puja from outside India?",
      a: "Submit the interest form and our team shares steps, schedule details, and participation instructions by email."
    },
    {
      q: "Does the form submission confirm participation?",
      a: "Form submission shares your interest. Our team follows up with confirmation and next actions."
    },
    {
      q: "Can I include family names in sankalp?",
      a: "Yes, you can add names and special prayer notes in the additional information field."
    }
  ]);

  return (
    <>
      <PujaDetailPage puja={puja} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}

