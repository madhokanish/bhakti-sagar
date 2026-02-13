import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { getActiveOnlinePujas, getOnlinePujaBySlug } from "@/lib/onlinePuja";
import { getPujaDetailConfig } from "@/lib/onlinePujaDetailConfig";
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
  const detailConfig = getPujaDetailConfig(puja);

  const faq = faqJsonLd(detailConfig.faqs.map((item) => ({ q: item.question, a: item.answer })));

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: puja.title,
    description: puja.tagline,
    brand: {
      "@type": "Brand",
      name: "Bhakti Sagar"
    },
    offers: {
      "@type": "Offer",
      priceCurrency: puja.booking.currency,
      price: puja.booking.priceAmount,
      availability: "https://schema.org/InStock",
      url: `https://bhakti-sagar.com/online-puja/${puja.slug}`
    },
    aggregateRating: detailConfig.reviews.length
      ? {
          "@type": "AggregateRating",
          ratingValue: 4.8,
          reviewCount: 12000
        }
      : undefined
  };

  return (
    <>
      <PujaDetailPage puja={puja} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
    </>
  );
}
