import type { Metadata } from "next";
import DeityTopicTemplate from "@/components/seo/DeityTopicTemplate";
import { DEITY_TOPICS } from "@/lib/hindiSeoContent";
import { buildTopicMetadata } from "@/lib/hindiSeoMetadata";

export function generateStaticParams() {
  return DEITY_TOPICS.shani.map((topic) => ({ topic }));
}

export function generateMetadata({ params }: { params: { topic: string } }): Metadata {
  return buildTopicMetadata("shani", params.topic, "en");
}

export default function ShaniTopicPage({ params }: { params: { topic: string } }) {
  return <DeityTopicTemplate deity="shani" topic={params.topic} locale="en" />;
}
