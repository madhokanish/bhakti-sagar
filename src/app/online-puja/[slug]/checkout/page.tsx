import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getOnlinePujaBySlug } from "@/lib/onlinePuja";
import PujaCheckoutClient from "@/components/online-puja/PujaCheckoutClient";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const puja = getOnlinePujaBySlug(params.slug);
  if (!puja || !puja.isActive) {
    return buildMetadata({
      title: "Checkout",
      description: "Online puja checkout",
      pathname: `/online-puja/${params.slug}/checkout`
    });
  }

  return buildMetadata({
    title: `Book ${puja.title}`,
    description: `Complete booking for ${puja.title} with clear schedule, timezone view, and confirmation details.`,
    pathname: `/online-puja/${puja.slug}/checkout`
  });
}

export default async function OnlinePujaCheckoutPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: {
    option?: string;
    name?: string;
    family?: string;
    gotra?: string;
    note?: string;
    cur?: string;
    amt?: string;
  };
}) {
  const puja = getOnlinePujaBySlug(params.slug);
  if (!puja || !puja.isActive) notFound();

  return (
    <div className="container py-6 md:py-10">
      <PujaCheckoutClient puja={puja} prefill={searchParams} />
    </div>
  );
}
