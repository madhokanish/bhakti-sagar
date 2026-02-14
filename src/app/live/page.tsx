import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getLiveMandirs } from "@/data/liveMandirs";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Live Darshan",
    description:
      "Watch live darshan from temples, catch the latest completed livestreams, and continue devotion from anywhere.",
    pathname: "/live"
  })
};

export default function LiveDarshanPage() {
  const mandirs = getLiveMandirs();

  return (
    <div className="container py-6 md:py-8">
      <section className="rounded-3xl border border-sagar-amber/25 bg-white/85 p-5 shadow-sagar-soft md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Live Darshan</p>
        <h1 className="mt-2 text-4xl font-serif leading-tight text-sagar-ink md:text-5xl">
          Darshan from mandirs, live and on demand
        </h1>
        <p className="mt-3 max-w-3xl text-base text-sagar-ink/75">
          We automatically show current live stream first. If a mandir is not live, we show the
          last livestream recording, then the latest regular upload.
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mandirs.map((mandir) => (
          <article
            key={mandir.id}
            className="overflow-hidden rounded-2xl border border-sagar-amber/20 bg-white/90 shadow-sagar-soft"
          >
            <div className="relative aspect-[16/9]">
              <Image
                src={mandir.thumbnail}
                alt={mandir.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4">
              <h2 className="text-xl font-serif text-sagar-ink">{mandir.name}</h2>
              <p className="mt-1 text-sm text-sagar-ink/70">{mandir.location}</p>
              <Link
                href={`/live/${mandir.id}`}
                className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-full bg-sagar-saffron px-4 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember"
              >
                View Darshan
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
