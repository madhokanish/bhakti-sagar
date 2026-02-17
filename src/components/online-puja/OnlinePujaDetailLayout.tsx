import type { ReactNode } from "react";
import type { OnlinePuja } from "@/lib/onlinePuja";
import PujaHeroCarousel from "@/components/online-puja/PujaHeroCarousel";
import PujaBookingSidebar from "@/components/online-puja/PujaBookingSidebar";

type Slide = {
  src: string;
  alt: string;
};

type Props = {
  puja: OnlinePuja;
  slides: Slide[];
  children: ReactNode;
};

const sectionTabs = [
  { href: "#about", label: "About" },
  { href: "#benefits", label: "Benefits" },
  { href: "#process", label: "Process" },
  { href: "#temple-details", label: "Temple Details" }
] as const;

export default function OnlinePujaDetailLayout({ puja, slides, children }: Props) {
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

            <section className="rounded-2xl border border-sagar-amber/20 bg-white/90 p-4 md:p-5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">
                Seva Highlights
              </p>
              <div className="mt-3 grid gap-2 text-sm text-sagar-ink/80 sm:grid-cols-2">
                <p className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/45 px-3 py-2">
                  Every {puja.weeklyDay} • {puja.startTime} IST
                </p>
                <p className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/45 px-3 py-2">
                  Temple-led ritual from {puja.temple.city}
                </p>
                <p className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/45 px-3 py-2">
                  Sankalp with your name and gotra
                </p>
                <p className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/45 px-3 py-2">
                  Confirmation and support on email
                </p>
              </div>
            </section>
          </div>

          <PujaBookingSidebar puja={puja} />
        </div>
      </section>

      <div className="mx-auto mt-6 max-w-4xl space-y-5 md:mt-8">{children}</div>
    </div>
  );
}
