import type { Metadata } from "next";
import DeityTopicTemplate from "@/components/seo/DeityTopicTemplate";
import { DEITY_TOPICS } from "@/lib/hindiSeoContent";
import { buildTopicMetadata } from "@/lib/hindiSeoMetadata";
import { getRequestLanguage } from "@/lib/seo";

export function generateStaticParams() {
  return DEITY_TOPICS.shani.map((topic) => ({ topic }));
}

export function generateMetadata({ params }: { params: { topic: string } }): Metadata {
  const locale = getRequestLanguage();
  return buildTopicMetadata("shani", params.topic, locale);
}

export default function ShaniTopicPage({ params }: { params: { topic: string } }) {
  const locale = getRequestLanguage();
  return <DeityTopicTemplate deity="shani" topic={params.topic} locale={locale} />;
}
