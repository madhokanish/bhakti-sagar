import Link from "next/link";
import type { OnlinePuja } from "@/lib/onlinePuja";
import OnlinePujaLayout from "@/components/online-puja/OnlinePujaLayout";
import PujaHeroCarousel from "@/components/online-puja/PujaHeroCarousel";
import PujaCountdownCard from "@/components/online-puja/PujaCountdownCard";
import PujaTrustRow from "@/components/online-puja/PujaTrustRow";
import PujaTabbedSectionNav from "@/components/online-puja/PujaTabbedSectionNav";
import PujaInterestForm from "@/components/online-puja/PujaInterestForm";
import StickyBottomCTA from "@/components/online-puja/StickyBottomCTA";

type Props = {
  puja: OnlinePuja;
};

export default function PujaDetailPage({ puja }: Props) {
  return (
    <OnlinePujaLayout eyebrow="Online Puja" title={puja.title} description={puja.tagline}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <PujaHeroCarousel
            slides={[
              { src: puja.heroImageUrl, alt: puja.heroImageAlt },
              { src: "/brand/bhakti-sagar-logo.png", alt: `${puja.title} devotional banner` }
            ]}
          />
          <PujaTabbedSectionNav puja={puja} />
          <section className="rounded-3xl border border-sagar-amber/20 bg-white p-5 md:p-6" id="interest-form">
            <h2 className="text-2xl font-serif text-sagar-ink">Interested in this Puja? Fill out the form below</h2>
            <p className="mt-2 text-sm text-sagar-ink/70">
              Submit your details and we will contact you with the next weekly cycle, participation process, and sankalp instructions.
            </p>
            <div className="mt-5">
              <PujaInterestForm pujaTitle={puja.title} pujaSlug={puja.slug} />
            </div>
          </section>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-sagar-amber/20 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sagar-rose">Scheduled Every {puja.weeklyDay}</p>
            <p className="mt-2 text-sm text-sagar-ink/75">
              Temple: {puja.temple.name}, {puja.temple.city}
            </p>
          </div>
          <PujaCountdownCard weeklyDay={puja.weeklyDay} startTime={puja.startTime} timeZone={puja.timezone} />
          <PujaTrustRow />
          <Link
            href="/online-puja"
            className="inline-flex rounded-full border border-sagar-amber/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/75"
          >
            Back to all online pujas
          </Link>
        </aside>
      </div>
      <StickyBottomCTA href="#interest-form" label="Submit Interest" />
    </OnlinePujaLayout>
  );
}

