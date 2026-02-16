"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import PaywallModal from "@/components/PaywallModal";

type Props = {
  featureName: string;
  returnTo: string;
  priceLabel: string;
  className?: string;
  lockBadge?: boolean;
  children: ReactNode;
};

export default function PaywallTrigger({
  featureName,
  returnTo,
  priceLabel,
  className,
  lockBadge = false,
  children
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {lockBadge ? <span className="mr-2 text-xs">🔒</span> : null}
        {children}
      </button>
      <PaywallModal
        open={open}
        onClose={() => setOpen(false)}
        featureName={featureName}
        returnTo={returnTo}
        priceLabel={priceLabel}
      />
    </>
  );
}
