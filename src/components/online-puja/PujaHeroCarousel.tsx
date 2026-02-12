"use client";

import { useState } from "react";
import Image from "next/image";

type Slide = {
  src: string;
  alt: string;
};

type Props = {
  slides: Slide[];
};

export default function PujaHeroCarousel({ slides }: Props) {
  const [active, setActive] = useState(0);
  const safeSlides = slides.length ? slides : [];

  if (!safeSlides.length) {
    return null;
  }

  const current = safeSlides[active] ?? safeSlides[0];

  return (
    <div className="overflow-hidden rounded-[1.7rem] border border-sagar-amber/25 bg-white p-2 shadow-sagar-soft md:p-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-[1.35rem] border border-sagar-amber/15">
        <Image
          src={current.src}
          alt={current.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 860px"
          priority
        />
      </div>
      {safeSlides.length > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 px-1 pb-1">
          <div className="flex items-center gap-2">
            {safeSlides.map((slide, index) => (
              <button
                key={`${slide.src}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron ${
                  index === active ? "w-7 bg-sagar-saffron" : "w-2.5 bg-sagar-amber/40"
                }`}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === active}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActive((prev) => (prev - 1 + safeSlides.length) % safeSlides.length)}
              className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-sagar-amber/30 bg-sagar-cream/50 text-sm font-semibold text-sagar-ink/70 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActive((prev) => (prev + 1) % safeSlides.length)}
              className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-sagar-amber/30 bg-sagar-cream/50 text-sm font-semibold text-sagar-ink/70 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
