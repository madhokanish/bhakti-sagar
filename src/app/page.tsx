import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getTopAartis } from "@/lib/data";
import { getRequestLanguage, buildMetadata } from "@/lib/seo";
import { getCurrencyForRequest } from "@/lib/subscription";
import { WEEKLY_PLANS } from "@/app/online-puja/plans";
import MobileQuickNav from "@/components/MobileQuickNav";
import CategoryCard from "@/components/CategoryCard";
import HomeTrackedLink from "@/components/home/HomeTrackedLink";
import HomeWeeklyMembershipSection from "@/components/home/HomeWeeklyMembershipSection";
import HomeStickyMembershipCTA from "@/components/home/HomeStickyMembershipCTA";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Aarti, Bhajan, Mantra & Pooja Vidhi",
    description:
      "Read aartis, chalisas, stotras, mantras and pooja guides with easy lyrics, meaning, and videos. Explore by deity and festival.",
    pathname: "/"
  })
};

export default async function HomePage() {
  const lang = getRequestLanguage();
  const categories = getCategories();
  const topAartis = getTopAartis();
  const membershipPlans = WEEKLY_PLANS.filter((plan) => plan.id === "ganesh" || plan.id === "shani");
  const currency = getCurrencyForRequest();
  const locale = currency === "USD" ? "en-US" : currency === "EUR" ? "en-IE" : "en-GB";

  const categoryImageBySlug = Object.fromEntries(
    categories.map((category) => [category.slug, category.imageUrl])
  ) as Record<string, string>;

  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());

  return (
    <div className="container pb-12">
      <section
        id="home-hero"
        className="relative mt-3 overflow-hidden rounded-[2rem] border border-sagar-amber/25 bg-gradient-to-br from-[#fffaf2] via-[#fff3e1] to-[#f8e3c6] p-4 shadow-sagar-soft md:mt-5 md:p-8"
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-sagar-gold/25 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-10 h-56 w-56 rounded-full bg-sagar-saffron/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.8)_0,rgba(255,255,255,0)_35%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,.7)_0,rgba(255,255,255,0)_40%)]" />

        <div className="relative grid gap-5 md:min-h-[34rem] md:grid-cols-[1.05fr_0.95fr] md:gap-8">
          <div className="flex flex-col justify-center gap-5 md:gap-7">
            <h1 className="max-w-[14ch] text-4xl font-serif leading-[1.05] text-sagar-ink sm:text-5xl lg:text-6xl">
              Daily devotion, made simple.
            </h1>
            <p className="max-w-[56ch] text-base leading-relaxed text-sagar-ink/78">
              Join Weekly Puja Membership for temple seva from home, then continue your daily rhythm with
              aartis and Choghadiya.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <HomeTrackedLink
                href="/online-puja"
                eventName="home_online_puja_cta_click"
                eventParams={{ placement: "hero", target: "membership" }}
                aria-label="Weekly Puja Membership"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-5 py-2.5 text-sm font-semibold text-white shadow-sagar-soft transition hover:bg-sagar-ember"
              >
                Weekly Puja Membership
              </HomeTrackedLink>
              <Link
                href="/aartis"
                aria-label="Explore Aartis"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-sagar-saffron/45 bg-white/85 px-5 py-2.5 text-sm font-semibold text-sagar-ember transition hover:bg-white"
              >
                Explore Aartis
              </Link>
              <Link
                href="/choghadiya"
                aria-label="Open Choghadiya"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-sagar-amber/40 bg-white/75 px-5 py-2.5 text-sm font-semibold text-sagar-ink/80 transition hover:bg-white"
              >
                Choghadiya
              </Link>
            </div>

          </div>

          <aside className="rounded-3xl border border-sagar-amber/25 bg-white/88 p-3 shadow-sagar-card md:p-4">
            <div className="relative aspect-[16/8.5] overflow-hidden rounded-2xl">
              <Image
                src="/brand/bhakti-sagar-logo.png"
                alt="Bhakti Sagar devotional banner"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
                priority
              />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
              Daily Prayer
            </p>
            <h2 className="mt-2 text-3xl font-serif leading-tight text-sagar-ink">
              Start with a top aarti
            </h2>

            <div className="mt-4 space-y-2.5">
              {topAartis.slice(0, 4).map((aarti) => {
                const title =
                  lang === "hi"
                    ? aarti.title.hindi || aarti.title.english
                    : aarti.title.english || aarti.title.hindi;
                const thumb = categoryImageBySlug[aarti.category] || "/category/ganesha.jpg";
                return (
                  <Link
                    key={aarti.id}
                    href={`/aartis/${aarti.slug}`}
                    className="flex items-center justify-between rounded-xl border border-sagar-amber/20 bg-white px-3 py-2.5 text-sm text-sagar-ink/82 transition hover:border-sagar-saffron/45"
                  >
                    <span className="flex items-center gap-3">
                      <span className="relative h-8 w-8 overflow-hidden rounded-lg border border-sagar-amber/25">
                        <Image
                          src={thumb}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="32px"
                          loading="lazy"
                        />
                      </span>
                      <span>{title}</span>
                    </span>
                    <span aria-hidden="true" className="text-lg text-sagar-saffron">›</span>
                  </Link>
                );
              })}
            </div>

            <Link
              href="/aartis"
              className="mx-auto mt-4 inline-flex min-h-[40px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember"
            >
              View all aartis
            </Link>
          </aside>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-sagar-amber/25 bg-white/90 p-3 shadow-sagar-soft md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-sagar-ink/80">
            This week&apos;s pujas: Ganesh (Wed) and Shani (Sat). Join membership for 4 pujas per month.
          </p>
          <HomeTrackedLink
            href="/online-puja"
            eventName="home_online_puja_cta_click"
            eventParams={{ placement: "promo_strip", target: "membership" }}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-sagar-saffron px-5 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember"
          >
            Join membership
          </HomeTrackedLink>
        </div>
      </section>

      <HomeWeeklyMembershipSection plans={membershipPlans} currency={currency} locale={locale} />

      <section className="mt-5 rounded-3xl border border-sagar-amber/20 bg-white/80 p-4 shadow-sagar-soft md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Today</p>
            <h2 className="mt-1 text-xl font-serif text-sagar-ink">Today&apos;s Muhurat & Devotion</h2>
            <p className="mt-1 text-sm text-sagar-ink/70">{todayLabel} · Plan with local Choghadiya timings</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/choghadiya"
              className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-sagar-saffron/40 bg-white px-4 py-2 text-sm font-semibold text-sagar-ember hover:bg-sagar-cream/60"
            >
              View Choghadiya
            </Link>
            <Link
              href="/panchang"
              className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-sagar-saffron/25 bg-white px-4 py-2 text-sm font-semibold text-sagar-ink/80 hover:bg-sagar-cream/60"
            >
              Panchang hub
            </Link>
            <Link
              href="/live"
              className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-sagar-amber/40 bg-white px-4 py-2 text-sm font-semibold text-sagar-ink/80 hover:bg-sagar-cream/60"
            >
              Live Darshan
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-serif text-sagar-ink">Aarti Categories</h2>
          <Link href="/categories" className="text-sm font-semibold text-sagar-ember hover:text-sagar-saffron">
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {categories.slice(0, 6).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <HomeStickyMembershipCTA targetId="home-hero" plans={membershipPlans} />
      <MobileQuickNav />
    </div>
  );
}
