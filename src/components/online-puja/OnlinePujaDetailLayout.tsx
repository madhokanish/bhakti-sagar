import Link from "next/link";
import type { ReactNode } from "react";
import type { OnlinePuja } from "@/lib/onlinePuja";
import { getNextPujaOccurrence } from "@/lib/onlinePuja";
import PujaHeroCarousel from "@/components/online-puja/PujaHeroCarousel";
import PujaCountdownCard from "@/components/online-puja/PujaCountdownCard";

type Slide = {
  src: string;
  alt: string;
};

type Props = {
  puja: OnlinePuja;
  slides: Slide[];
  ctaHref: string;
  children: ReactNode;
};

const sectionTabs = [
  { href: "#about", label: "About" },
  { href: "#benefits", label: "Benefits" },
  { href: "#process", label: "Process" },
  { href: "#temple-details", label: "Temple Details" }
] as const;

export default function OnlinePujaDetailLayout({ puja, slides, ctaHref, children }: Props) {
  const nextOccurrence = getNextPujaOccurrence({
    weeklyDay: puja.weeklyDay,
    startTime: puja.startTime,
    timeZone: puja.timezone
  });

  const nextSevaLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: puja.timezone
  }).format(nextOccurrence);

  return (
    <div className="container py-5 md:py-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-sagar-amber/20 bg-gradient-to-br from-sagar-cream via-white to-sagar-sand/80 p-4 shadow-sagar-soft md:p-7">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sagar-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-8 h-72 w-72 rounded-full bg-sagar-saffron/10 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sagar-saffron">Online Puja</p>
              <h1 className="mt-2 text-3xl leading-tight text-sagar-ink md:text-5xl">{puja.title}</h1>
              <p className="mt-3 max-w-2xl text-base text-sagar-ink/75 md:text-lg">{puja.tagline}</p>
            </div>

            <PujaHeroCarousel slides={slides} />

            <nav
              aria-label="Online puja section tabs"
              className="sticky top-[4.25rem] z-20 -mx-1 overflow-x-auto rounded-2xl border border-sagar-amber/20 bg-white/95 px-2 py-2 shadow-sagar-soft backdrop-blur"
            >
              <div className="flex min-w-max items-center gap-2">
                {sectionTabs.map((tab) => (
                  <a
                    key={tab.href}
                    href={tab.href}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-sagar-amber/25 bg-sagar-cream/45 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/80 transition hover:border-sagar-saffron/40 hover:bg-white hover:text-sagar-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
                  >
                    {tab.label}
                  </a>
                ))}
              </div>
            </nav>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.75rem] border border-sagar-amber/25 bg-white/95 p-4 shadow-sagar-card md:p-5">
              <h2 className="text-3xl text-sagar-ink md:text-[2rem]">Next Seva</h2>

              <div className="mt-3 rounded-2xl border border-sagar-amber/25 bg-sagar-cream/65 px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.19em] text-sagar-rose">Next Date & Time</p>
                <p className="mt-1 text-lg font-semibold text-sagar-ink">{nextSevaLabel}</p>
              </div>

              <div className="mt-3">
                <PujaCountdownCard
                  weeklyDay={puja.weeklyDay}
                  startTime={puja.startTime}
                  timeZone={puja.timezone}
                />
              </div>

              <div className="mt-3 rounded-2xl border border-sagar-amber/20 bg-white p-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">Temple</p>
                <p className="mt-1 text-sm leading-relaxed text-sagar-ink/80">
                  {puja.temple.name}, {puja.temple.city}, {puja.temple.state}
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/55 px-3 py-2 text-sm font-medium text-sagar-ink/85">
                  Verified schedule
                </div>
                <div className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/55 px-3 py-2 text-sm font-medium text-sagar-ink/85">
                  Sankalp in your name
                </div>
                <div className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/55 px-3 py-2 text-sm font-medium text-sagar-ink/85">
                  Email updates & clear coordination
                </div>
              </div>

              <a
                href={ctaHref}
                className="mt-4 inline-flex w-full min-h-[46px] items-center justify-center rounded-full bg-sagar-saffron px-5 py-2.5 text-base font-semibold text-white shadow-sagar-soft transition hover:bg-sagar-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
              >
                Join Seva
              </a>
              <Link
                href="/online-puja"
                className="mt-3 inline-flex w-full min-h-[42px] items-center justify-center rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-sm font-semibold text-sagar-ink/75 transition hover:bg-sagar-cream/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
              >
                Browse all Online Pujas
              </Link>
            </div>

            <div className="rounded-2xl border border-sagar-amber/20 bg-white/95 p-4 shadow-sagar-soft">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">Help & Support</p>
              <a
                href="mailto:support@bhakti-sagar.com"
                className="mt-2 inline-flex rounded-lg border border-sagar-amber/25 bg-sagar-cream/45 px-3 py-2 text-sm font-medium text-sagar-ink/80 transition hover:bg-sagar-cream"
              >
                support@bhakti-sagar.com
              </a>
            </div>
          </aside>
        </div>
      </section>

      <div className="mx-auto mt-6 max-w-4xl space-y-5 md:mt-8">{children}</div>
    </div>
  );
}
