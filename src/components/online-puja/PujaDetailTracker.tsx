"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  sevaId: string;
};

export default function PujaDetailTracker({ sevaId }: Props) {
  useEffect(() => {
    trackEvent("online_puja_detail_view", { seva_id: sevaId });
  }, [sevaId]);

  return null;
}
