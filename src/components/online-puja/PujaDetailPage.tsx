import Image from "next/image";
import Link from "next/link";
import { getActiveOnlinePujas, getNextPujaOccurrence, type OnlinePuja } from "@/lib/onlinePuja";
import { getPujaDetailConfig } from "@/lib/onlinePujaDetailConfig";
import FAQAccordion from "@/components/online-puja/FAQAccordion";
import ImageCarousel from "@/components/online-puja/ImageCarousel";
import PujaDetailTracker from "@/components/online-puja/PujaDetailTracker";
import ReviewsBlock from "@/components/online-puja/ReviewsBlock";
import SectionTabs from "@/components/online-puja/SectionTabs";
import StickyBookingCard from "@/components/online-puja/StickyBookingCard";
import StickyBottomCTA from "@/components/online-puja/StickyBottomCTA";

type Props = {
  puja: OnlinePuja;
};

const sectionItems = [
  { id: "benefits", label: "Benefits" },
  { id: "how-it-works", label: "How It Works" },
  { id: "temple-priests", label: "Temple & Priests" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
  { id: "related-sevas", label: "Related Sevas" }
] as const;

export default function PujaDetailPage({ puja }: Props) {
  const detailConfig = getPujaDetailConfig(puja);
  const relatedPujas = getActiveOnlinePujas()
    .filter((item) => item.slug !== puja.slug)
    .slice(0, 4);

  const templeMapQuery = encodeURIComponent(`${puja.temple.name}, ${puja.temple.city}, ${puja.temple.state}`);
  const templeMapHref = `https://www.google.com/maps/search/?api=1&query=${templeMapQuery}`;

  const nextOccurrence = getNextPujaOccurrence({
    weeklyDay: puja.weeklyDay,
    startTime: puja.startTime,
    timeZone: puja.timezone
  });
  const nextOccurrenceIst = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: puja.timezone
  }).format(nextOccurrence);

  return (
    <>
      <PujaDetailTracker sevaId={puja.id} />

      <div className="container py-5 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_400px] lg:gap-8">
          <main className="space-y-5">
            <section className="rounded-[2rem] border border-sagar-amber/20 bg-gradient-to-br from-sagar-cream via-white to-sagar-sand/75 p-4 shadow-sagar-soft md:p-7">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sagar-saffron">Online Puja</p>
              <h1 className="mt-2 text-5xl leading-[1.05] text-sagar-ink md:text-6xl">{puja.title}</h1>
              <p className="mt-3 text-base text-sagar-ink/78 md:text-lg">{detailConfig.subtitle}</p>

              <div className="mt-5">
                <ImageCarousel slides={detailConfig.carouselImages} priority />
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {detailConfig.topChips.map((chip) => (
                  <article
                    key={chip.label}
                    className="rounded-2xl border border-sagar-amber/20 bg-white/85 px-3 py-2 text-sm font-medium text-sagar-ink/82"
                  >
                    <span className="mr-2" aria-hidden="true">
                      {chip.icon}
                    </span>
                    {chip.label}
                  </article>
                ))}
              </div>
            </section>

            <div className="lg:hidden">
              <StickyBookingCard
                puja={puja}
                options={detailConfig.bookingOptions}
                deliverables={detailConfig.deliverablesTimeline}
              />
            </div>

            <SectionTabs items={sectionItems.map((item) => ({ ...item }))} />

            <section id="benefits" className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
              <h2 className="text-3xl text-sagar-ink md:text-4xl">Benefits</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {detailConfig.benefitCards.map((benefit) => (
                  <article key={benefit.id} className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
                    <p className="text-xl" aria-hidden="true">
                      {benefit.icon}
                    </p>
                    <h3 className="mt-2 text-2xl text-sagar-ink">{benefit.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-sagar-ink/75">{benefit.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="how-it-works" className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
              <h2 className="text-3xl text-sagar-ink md:text-4xl">How It Works</h2>
              <ol className="mt-4 space-y-3">
                {detailConfig.howItWorks.map((step, index) => (
                  <li key={step} className="flex gap-3 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-4">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sagar-saffron text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-sagar-ink/78">{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="temple-priests" className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
              <h2 className="text-3xl text-sagar-ink md:text-4xl">Temple & Priests</h2>
              <p className="mt-2 text-sm leading-relaxed text-sagar-ink/78">{detailConfig.templeCredibility}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {detailConfig.templeImages.map((image, index) => (
                  <div key={`${image.src}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-sagar-amber/20">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 360px"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-sagar-amber/25 bg-sagar-cream/40 px-3 py-1 text-xs font-semibold text-sagar-ink/75">
                  {puja.temple.name}
                </span>
                <a
                  href={templeMapHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-sagar-amber/25 bg-white px-3 py-1 text-xs font-semibold text-sagar-ink/75"
                >
                  {puja.temple.city}, {puja.temple.state}
                </a>
              </div>
            </section>

            <ReviewsBlock ratingSummary="Rated 4.8 by devotees across India, UK, USA, UAE and Canada." reviews={detailConfig.reviews} />

            <FAQAccordion items={detailConfig.faqs} />

            <section id="related-sevas" className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
              <h2 className="text-3xl text-sagar-ink md:text-4xl">Related Sevas</h2>

              {relatedPujas.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {relatedPujas.map((related) => (
                    <Link
                      key={related.slug}
                      href={`/online-puja/${related.slug}`}
                      className="group overflow-hidden rounded-2xl border border-sagar-amber/20 bg-sagar-cream/35 transition hover:-translate-y-0.5 hover:border-sagar-saffron/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron/60"
                      aria-label={`Open ${related.title} seva`}
                    >
                      <div className="relative aspect-[16/10]">
                        <Image
                          src={related.heroImageUrl}
                          alt={related.heroImageAlt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 420px"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-sagar-rose">
                          Every {related.weeklyDay}
                        </p>
                        <h3 className="mt-1 text-2xl text-sagar-ink">{related.title}</h3>
                        <p className="mt-2 text-sm text-sagar-ink/72">{related.tagline}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sagar-ember/80">
                          Open Seva
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-sagar-ink/72">More sevas will be added shortly.</p>
              )}
            </section>
          </main>

          <div className="hidden lg:block">
            <StickyBookingCard
              puja={puja}
              options={detailConfig.bookingOptions}
              deliverables={detailConfig.deliverablesTimeline}
            />
          </div>
        </div>
      </div>

      <StickyBottomCTA
        href={`/online-puja/${puja.slug}/checkout`}
        label="Proceed to payment"
        booking={puja.booking}
        metaSuffix={`${nextOccurrenceIst} IST`}
        eventName="proceed_to_payment_clicked"
        eventParams={{ seva_id: puja.id, source: "sticky_mobile" }}
      />
    </>
  );
}
