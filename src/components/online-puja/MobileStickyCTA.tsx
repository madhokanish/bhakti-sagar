"use client";

import { useEffect, useState } from "react";

type Props = {
  targetId: string;
  label: string;
  priceLabel: string;
  onClick: () => void;
};

export default function MobileStickyCTA({ targetId, label, priceLabel, onClick }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sagar-amber/30 bg-white/98 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sagar-rose">Selected plan</p>
          <p className="text-sm font-semibold text-sagar-ink">{priceLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-5 py-2 text-sm font-semibold text-white"
        >
          {label}
        </button>
      </div>
    </div>
  );
}
