"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type BhaktiGptPageViewProps = {
  page: "landing" | "chat";
};

export default function BhaktiGptPageView({ page }: BhaktiGptPageViewProps) {
  useEffect(() => {
    trackEvent("viewed_bhaktigpt", { page });
  }, [page]);

  return null;
}
