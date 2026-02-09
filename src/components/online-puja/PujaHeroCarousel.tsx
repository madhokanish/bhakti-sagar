"use client";

import { useMemo, useState } from "react";
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
  const safeSlides = useMemo(() => (slides.length ? slides : []), [slides]);

  if (!safeSlides.length) {
    return null;
  }

  const current = safeSlides[active] ?? safeSlides[0];

  return (
    <div className="rounded-3xl border border-sagar-amber/25 bg-white p-3 shadow-sagar-soft">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
        <Image src={current.src} alt={current.alt} fill className="object-cover" sizes="100vw" priority />
      </div>
      {safeSlides.length > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            {safeSlides.map((slide, index) => (
              <button
                key={`${slide.src}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === active ? "w-8 bg-sagar-saffron" : "w-2.5 bg-sagar-amber/40"
                }`}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActive((prev) => (prev - 1 + safeSlides.length) % safeSlides.length)}
              className="rounded-full border border-sagar-amber/30 px-3 py-1 text-xs font-semibold text-sagar-ink/70"
              aria-label="Previous image"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setActive((prev) => (prev + 1) % safeSlides.length)}
              className="rounded-full border border-sagar-amber/30 px-3 py-1 text-xs font-semibold text-sagar-ink/70"
              aria-label="Next image"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
