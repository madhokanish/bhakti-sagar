import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DarshanPlayer from "@/components/DarshanPlayer";
import { getLiveMandirById, getLiveMandirs } from "@/data/liveMandirs";
import { resolveChannelIdFromUrl } from "@/lib/liveDarshan";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const mandir = getLiveMandirById(params.id);
  if (!mandir) {
    return buildMetadata({
      title: "Live Darshan",
      description: "Watch live darshan from temples.",
      pathname: "/live"
    });
  }

  return buildMetadata({
    title: `${mandir.name} Live Darshan`,
    description: `Watch ${mandir.name} live darshan, latest livestream recording, or recent uploads from ${mandir.location}.`,
    pathname: `/live/${mandir.id}`
  });
}

export default async function LiveMandirPage({ params }: { params: { id: string } }) {
  const mandir = getLiveMandirById(params.id);
  if (!mandir) {
    notFound();
  }

  const channelId = mandir.channelId ?? (await resolveChannelIdFromUrl(mandir.channelUrl));
  const moreMandirs = getLiveMandirs().filter((item) => item.id !== mandir.id).slice(0, 4);

  return (
    <div className="container py-6 md:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-sagar-ink/65">
        <Link href="/" className="hover:text-sagar-ember">
          Home
        </Link>
        <span className="mx-2">›</span>
        <Link href="/live" className="hover:text-sagar-ember">
          Live Darshan
        </Link>
        <span className="mx-2">›</span>
        <span>{mandir.name}</span>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-sagar-amber/25 bg-white/85 p-5 shadow-sagar-soft">
            <h1 className="text-4xl font-serif leading-tight text-sagar-ink md:text-5xl">{mandir.name}</h1>
            <p className="mt-2 text-base text-sagar-ink/72">{mandir.location}</p>
          </div>
          <DarshanPlayer channelId={channelId} channelUrl={mandir.channelUrl} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-sagar-amber/25 bg-white/90 p-4 shadow-sagar-soft">
            <h2 className="text-2xl font-serif text-sagar-ink">Channel</h2>
            <p className="mt-2 text-sm text-sagar-ink/72">
              This player follows a strict order: current live stream, last live recording, then
              latest video.
            </p>
            <a
              href={mandir.channelUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-full border border-sagar-saffron/35 px-4 py-2 text-sm font-semibold text-sagar-ember transition hover:bg-sagar-cream/70"
            >
              Open YouTube Channel
            </a>
          </div>

          <div className="rounded-3xl border border-sagar-amber/25 bg-white/90 p-4 shadow-sagar-soft">
            <h2 className="text-2xl font-serif text-sagar-ink">More Live Darshans</h2>
            <div className="mt-3 space-y-3">
              {moreMandirs.map((item) => (
                <Link
                  key={item.id}
                  href={`/live/${item.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-sagar-amber/20 bg-white px-3 py-2 transition hover:border-sagar-saffron/40"
                >
                  <span className="relative h-12 w-16 overflow-hidden rounded-xl border border-sagar-amber/20">
                    <Image
                      src={item.thumbnail}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                      loading="lazy"
                    />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-sagar-ink">{item.name}</span>
                    <span className="block text-xs text-sagar-ink/65">{item.location}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
