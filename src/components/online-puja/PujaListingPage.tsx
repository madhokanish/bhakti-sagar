import Image from "next/image";
import Link from "next/link";
import type { OnlinePuja } from "@/lib/onlinePuja";
import OnlinePujaLayout from "@/components/online-puja/OnlinePujaLayout";
import PujaCountdownCard from "@/components/online-puja/PujaCountdownCard";

type Props = {
  pujas: OnlinePuja[];
};

export default function PujaListingPage({ pujas }: Props) {
  return (
    <OnlinePujaLayout
      eyebrow="Online Puja"
      title="Temple seva from home"
      description="Join recurring online puja services each week. Select a puja, review details, and submit your interest to get participation guidance."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {pujas.map((puja) => (
          <article
            key={puja.slug}
            className="overflow-hidden rounded-3xl border border-sagar-amber/20 bg-white shadow-sagar-soft"
          >
            <div className="relative aspect-[4/3]">
              <Image src={puja.heroImageUrl} alt={puja.heroImageAlt} fill className="object-cover" sizes="100vw" />
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-sagar-rose">{puja.deity} Puja</p>
                <h2 className="mt-2 text-2xl font-serif text-sagar-ink">{puja.title}</h2>
                <p className="mt-2 text-sm text-sagar-ink/70">{puja.tagline}</p>
              </div>

              {puja.isActive ? (
                <PujaCountdownCard weeklyDay={puja.weeklyDay} startTime={puja.startTime} timeZone={puja.timezone} compact />
              ) : (
                <div className="rounded-2xl border border-sagar-amber/25 bg-sagar-sand/60 p-4 text-sm text-sagar-ink/75">
                  Launching soon. A new weekly seva slot will be announced soon.
                </div>
              )}

              {puja.isActive ? (
                <Link
                  href={`/online-puja/${puja.slug}`}
                  className="inline-flex rounded-full bg-sagar-saffron px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white"
                >
                  View Details
                </Link>
              ) : (
                <span className="inline-flex rounded-full border border-sagar-amber/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/55">
                  Coming Soon
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </OnlinePujaLayout>
  );
}

