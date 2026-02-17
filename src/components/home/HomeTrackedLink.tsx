"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { EventParams } from "@/lib/analytics";
import { trackEvent } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
  eventName?: string;
  eventParams?: EventParams;
};

export default function HomeTrackedLink({
  eventName,
  eventParams,
  onClick,
  ...props
}: Props) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        if (eventName) {
          trackEvent(eventName, eventParams ?? {});
        }
        onClick?.(event);
      }}
    />
  );
}
