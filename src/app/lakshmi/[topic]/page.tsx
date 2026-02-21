import type { Metadata } from "next";
import DeityTopicTemplate from "@/components/seo/DeityTopicTemplate";
import { DEITY_TOPICS } from "@/lib/hindiSeoContent";
import { buildTopicMetadata } from "@/lib/hindiSeoMetadata";
import { getRequestLanguage } from "@/lib/seo";

export function generateStaticParams() {
  return DEITY_TOPICS.lakshmi.map((topic) => ({ topic }));
}

export function generateMetadata({ params }: { params: { topic: string } }): Metadata {
  const locale = getRequestLanguage();
  return buildTopicMetadata("lakshmi", params.topic, locale);
}

export default function LakshmiTopicPage({ params }: { params: { topic: string } }) {
  const locale = getRequestLanguage();
  return <DeityTopicTemplate deity="lakshmi" topic={params.topic} locale={locale} />;
}
