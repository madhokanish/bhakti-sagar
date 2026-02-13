import Image from "next/image";
import Link from "next/link";
import type { OnlinePuja } from "@/lib/onlinePuja";
import { formatPujaPrice, getActiveOnlinePujas, getNextPujaOccurrence } from "@/lib/onlinePuja";
import OnlinePujaDetailLayout from "@/components/online-puja/OnlinePujaDetailLayout";
import PujaInterestForm from "@/components/online-puja/PujaInterestForm";
import StickyBottomCTA from "@/components/online-puja/StickyBottomCTA";
import PujaDetailTracker from "@/components/online-puja/PujaDetailTracker";

type Props = {
  puja: OnlinePuja;
};

function SectionTitle({ id, title }: { id: string; title: string }) {
  return (
    <div className="mb-4 border-b border-sagar-amber/20 pb-3">
      <h2 id={id} className="scroll-mt-32 text-3xl text-sagar-ink md:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sagar-saffron/15 text-xs font-bold text-sagar-saffron"
          >
            ✓
          </span>
          <span className="text-base leading-relaxed text-sagar-ink/82">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PujaDetailPage({ puja }: Props) {
  const slides = [{ src: puja.heroImageUrl, alt: puja.heroImageAlt }];
  const relatedPujas = getActiveOnlinePujas()
    .filter((item) => item.slug !== puja.slug)
    .slice(0, 3);
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

  const templeMapQuery = encodeURIComponent(
    `${puja.temple.name}, ${puja.temple.city}, ${puja.temple.state}`
  );
  const templeMapHref = `https://www.google.com/maps/search/?api=1&query=${templeMapQuery}`;

  const faqItems = [
    {
      q: `When is ${puja.title} performed?`,
      a: `${puja.title} is performed every ${puja.weeklyDay}. The live countdown always reflects the next scheduled seva.`
    },
    {
      q: "Can I include family names in sankalp?",
      a: "Yes. Add names and prayer notes in the additional information field while submitting the form."
    },
    {
      q: "How will I receive participation updates?",
      a: "Once you submit your interest, you will receive follow-up guidance by email with the next steps."
    }
  ];

  return (
    <>
      <PujaDetailTracker sevaId={puja.id} />
      <OnlinePujaDetailLayout puja={puja} slides={slides}>
        <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
          <SectionTitle id="about" title="About" />
          {puja.sections.about.length > 0 ? (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-sagar-ink/82">{puja.sections.about[0]}</p>
              {puja.sections.about.length > 1 && <CheckList items={puja.sections.about.slice(1)} />}
            </div>
          ) : (
            <p className="text-sm text-sagar-ink/70">Not found in repo.</p>
          )}
        </section>

        <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
          <SectionTitle id="benefits" title="Benefits" />
          {puja.sections.benefits.length > 0 ? (
            <CheckList items={puja.sections.benefits} />
          ) : (
            <p className="text-sm text-sagar-ink/70">Not found in repo.</p>
          )}
        </section>

        <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
          <SectionTitle id="process" title="Process" />
          {puja.sections.process.length > 0 ? (
            <ol className="space-y-3">
              {puja.sections.process.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-4"
                >
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sagar-saffron text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-base leading-relaxed text-sagar-ink/82">{step}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-sagar-ink/70">Not found in repo.</p>
          )}
        </section>

        <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
          <SectionTitle id="temple-details" title="Temple Details" />
          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.19em] text-sagar-rose">
              Temple
            </p>
            <h3 className="mt-1 text-2xl text-sagar-ink">{puja.temple.name}</h3>
            <p className="mt-1 text-sm text-sagar-ink/75">
              {puja.temple.city}, {puja.temple.state}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-sagar-amber/25 bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-sagar-ink/70">
                Verified schedule
              </span>
              <span className="rounded-full border border-sagar-amber/25 bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-sagar-ink/70">
                Temple-led ritual
              </span>
            </div>
            <a
              href={templeMapHref}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-sagar-ink/75 transition hover:bg-sagar-cream/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron"
            >
              Open in Maps
            </a>
          </div>
          <div className="mt-4">
            {puja.sections.temple.length > 0 ? (
              <CheckList items={puja.sections.temple} />
            ) : (
              <p className="text-sm text-sagar-ink/70">Not found in repo.</p>
            )}
          </div>
        </section>

        {puja.booking.deliverables.length > 0 && (
          <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
            <SectionTitle id="inclusions" title="What You Will Receive" />
            <div className="grid gap-3 sm:grid-cols-2">
              {puja.booking.deliverables.map((item) => (
                <article
                  key={item}
                  className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-4 text-sm leading-relaxed text-sagar-ink/82"
                >
                  {item}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
          <SectionTitle id="faq" title="Frequently Asked Questions" />
          <div className="space-y-3">
            {faqItems.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 p-4">
                <summary className="cursor-pointer list-none text-base font-semibold text-sagar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-sagar-ink/75">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {relatedPujas.length > 0 && (
          <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7">
            <SectionTitle id="related-pujas" title="Related Online Pujas" />
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedPujas.map((related) => (
                <article
                  key={related.slug}
                  className="overflow-hidden rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40"
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
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-sagar-rose">
                      Every {related.weeklyDay}
                    </p>
                    <h3 className="mt-2 text-xl text-sagar-ink">{related.title}</h3>
                    <p className="mt-2 text-sm text-sagar-ink/75">{related.tagline}</p>
                    <Link
                      href={`/online-puja/${related.slug}`}
                      className="mt-3 inline-flex min-h-[40px] items-center rounded-full border border-sagar-amber/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-sagar-ink/80 transition hover:bg-sagar-cream"
                    >
                      View Puja
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!puja.booking.isPaymentEnabled && (
          <section
            id="interest-form"
            className="scroll-mt-28 rounded-3xl border border-sagar-amber/20 bg-white p-5 shadow-sagar-soft md:p-7"
          >
            <h2 className="text-3xl text-sagar-ink md:text-4xl">Payment temporarily unavailable</h2>
            <p className="mt-2 text-sm text-sagar-ink/70">
              You can still reserve this seva by submitting your details below. Our team will confirm the next cycle
              by email.
            </p>
            <div className="mt-5">
              <PujaInterestForm pujaTitle={puja.title} pujaSlug={puja.slug} />
            </div>
          </section>
        )}
      </OnlinePujaDetailLayout>

      <StickyBottomCTA
        href={puja.booking.isPaymentEnabled ? `/online-puja/${puja.slug}/checkout` : "#interest-form"}
        label={puja.booking.isPaymentEnabled ? "Book Seva" : "Reserve Seva"}
        meta={`${formatPujaPrice(puja.booking)} • ${nextOccurrenceIst} IST`}
        eventName="cta_book_click"
        eventParams={{ seva_id: puja.id, source: "sticky_mobile" }}
      />
    </>
  );
}
