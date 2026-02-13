"use client";

import { trackEvent, type EventParams } from "@/lib/analytics";

type Props = {
  href: string;
  label: string;
  meta?: string;
  eventName?: string;
  eventParams?: EventParams;
};

export default function StickyBottomCTA({ href, label, meta, eventName, eventParams }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-3 z-30 px-4 md:hidden">
      <a
        href={href}
        onClick={() => {
          if (eventName) {
            trackEvent(eventName, eventParams);
          }
        }}
        className="block rounded-2xl bg-sagar-saffron px-5 py-2.5 text-center text-white shadow-sagar-soft"
      >
        <span className="block text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
        {meta ? <span className="mt-1 block text-[0.68rem] text-white/90">{meta}</span> : null}
      </a>
    </div>
  );
}
