"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Props = {
  measurementId: string;
};

export default function GoogleAnalyticsPageTracker({ measurementId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    if (!measurementId || typeof window === "undefined") {
      return;
    }

    const gtag = window.gtag;
    if (typeof gtag !== "function") return;

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (path === lastTrackedRef.current) return;

    lastTrackedRef.current = path;

    gtag("event", "page_view", {
      page_title: document.title,
      page_path: path,
      page_location: window.location.href,
      send_to: measurementId
    });
  }, [measurementId, pathname, searchParams]);

  return null;
}
