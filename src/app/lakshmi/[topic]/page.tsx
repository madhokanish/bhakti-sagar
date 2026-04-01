import type { Metadata } from "next";
import DeityTopicTemplate from "@/components/seo/DeityTopicTemplate";
import { DEITY_TOPICS } from "@/lib/hindiSeoContent";
import { buildTopicMetadata } from "@/lib/hindiSeoMetadata";

export function generateStaticParams() {
  return DEITY_TOPICS.lakshmi.map((topic) => ({ topic }));
}

export function generateMetadata({ params }: { params: { topic: string } }): Metadata {
  return buildTopicMetadata("lakshmi", params.topic, "en");
}

export default function LakshmiTopicPage({ params }: { params: { topic: string } }) {
  return <DeityTopicTemplate deity="lakshmi" topic={params.topic} locale="en" />;
}
