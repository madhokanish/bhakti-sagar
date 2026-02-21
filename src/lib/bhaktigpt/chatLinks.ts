import type { BhaktiGuideId } from "@/lib/bhaktigpt/guides";

export function buildBhaktiChatHref(params: {
  guideId: BhaktiGuideId;
  prefill?: string;
  forceNew?: boolean;
  conversationId?: string;
}) {
  const query = new URLSearchParams();
  query.set("guide", params.guideId);

  if (params.conversationId) {
    query.set("conversationId", params.conversationId);
  }

  if (params.forceNew) {
    query.set("new", "1");
  }

  if (params.prefill) {
    query.set("prefill", params.prefill);
  }

  return `/bhaktigpt/chat?${query.toString()}`;
}
