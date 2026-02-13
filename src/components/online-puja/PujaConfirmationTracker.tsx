"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  orderId: string;
  mode: string;
};

export default function PujaConfirmationTracker({ orderId, mode }: Props) {
  useEffect(() => {
    trackEvent("confirmation_view", {
      order_id: orderId,
      mode
    });
  }, [mode, orderId]);

  return null;
}
