"use client";

import { useEffect, useState } from "react";

type TabItem = {
  id: string;
  label: string;
};

type Props = {
  items: TabItem[];
};

export default function SectionTabs({ items }: Props) {
  const [activeId, setActiveId] = useState(items[0]?.id || "");

  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-35% 0px -50% 0px",
        threshold: [0.1, 0.3, 0.6]
      }
    );

    items.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Online puja section navigation"
      className="sticky top-[4.25rem] z-20 overflow-x-auto rounded-2xl border border-sagar-amber/20 bg-white/95 px-2 py-2 shadow-sagar-soft backdrop-blur"
    >
      <div className="flex min-w-max items-center gap-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`inline-flex min-h-[40px] items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron ${
                isActive
                  ? "border-sagar-saffron/45 bg-sagar-cream text-sagar-ember"
                  : "border-sagar-amber/25 bg-white text-sagar-ink/75 hover:border-sagar-saffron/35"
              }`}
              aria-current={isActive ? "true" : undefined}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
