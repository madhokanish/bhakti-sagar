"use client";

import { useState } from "react";
import Image from "next/image";

type Slide = {
  src: string;
  alt: string;
};

type Props = {
  slides: Slide[];
  priority?: boolean;
};

export default function ImageCarousel({ slides, priority = false }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!slides.length) return null;

  const current = slides[activeIndex] ?? slides[0];
  const hasControls = slides.length > 1;

  return (
    <section className="overflow-hidden rounded-[1.9rem] border border-sagar-amber/25 bg-white p-2 shadow-sagar-soft md:p-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-[1.45rem] border border-sagar-amber/20">
        <Image
          src={current.src}
          alt={current.alt}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 900px"
        />

        {hasControls ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-sagar-ink shadow-sagar-soft transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setActiveIndex((prev) => (prev + 1) % slides.length)}
              className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-sagar-ink shadow-sagar-soft transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
