"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  plan: string;
  mode: string;
};

export default function CheckoutSuccessTracker({ plan, mode }: Props) {
  useEffect(() => {
    trackEvent("checkout_success", { plan, mode });
  }, [mode, plan]);

  return null;
}
