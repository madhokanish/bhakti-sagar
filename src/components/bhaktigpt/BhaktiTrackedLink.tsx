"use client";

import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { trackEvent, type EventParams } from "@/lib/analytics";

type BhaktiTrackedLinkProps = LinkProps & {
  className?: string;
  children: ReactNode;
  eventName: string;
  eventParams?: EventParams;
};

export default function BhaktiTrackedLink({
  className,
  children,
  eventName,
  eventParams,
  ...props
}: BhaktiTrackedLinkProps) {
  return (
    <Link
      {...props}
      className={className}
      onClick={() => trackEvent(eventName, eventParams)}
    >
      {children}
    </Link>
  );
}
