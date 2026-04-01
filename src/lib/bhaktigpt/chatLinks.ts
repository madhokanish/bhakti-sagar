import type { BhaktiGuideId } from "@/lib/bhaktigpt/guides";

export function buildBhaktiChatHref(params: {
  guideId: BhaktiGuideId;
  prefill?: string;
  forceNew?: boolean;
  conversationId?: string;
  chatLang?: "en" | "hinglish" | "hi";
}) {
  const query = new URLSearchParams();
  query.set("guide", params.guideId);

  if (params.chatLang) {
    query.set("lang", params.chatLang);
  }

  if (params.conversationId) {
    query.set("conversationId", params.conversationId);
  }

  if (params.forceNew) {
    query.set("new", "1");
  }

  if (params.prefill) {
    query.set("prefill", params.prefill);
  }

  return `/chat?${query.toString()}`;
}
