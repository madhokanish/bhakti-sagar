import type { Metadata } from "next";
import GuideCard from "@/components/bhaktigpt/GuideCard";
import {
  BHAKTI_GUIDES,
  BHAKTIGPT_DISCLAIMER,
  type BhaktiGuideId
} from "@/lib/bhaktigpt/guides";
import { buildMetadata } from "@/lib/seo";
import BhaktiGptPageView from "@/components/bhaktigpt/BhaktiGptPageView";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "BhaktiGPT - Devotional AI Guidance",
    description:
      "Chat with Shri Krishna, Shani Dev, and Goddess Lakshmi for calm devotional guidance rooted in dharma.",
    pathname: "/bhaktigpt",
    keywords: ["BhaktiGPT", "devotional AI", "gita guidance", "online spiritual guidance"]
  })
};

const testimonials = [
  { name: "Rohan M.", city: "London", text: "I come here when my mind spirals. The guidance is simple and practical." },
  { name: "Meera K.", city: "Toronto", text: "I use the Krishna guide for hard decisions. It helps me act with clarity." },
  { name: "Ananya P.", city: "Mumbai", text: "The Lakshmi guide gives me calm structure around money stress and gratitude." }
];

const faqs = [
  {
    q: "Is this really the deity?",
    a: "No. BhaktiGPT is an AI guide inspired by teachings and tradition, not a literal deity."
  },
  {
    q: "Does it predict the future?",
    a: "No. It avoids prediction and fear-based claims, and focuses on reflection and practical next steps."
  },
  {
    q: "Is my chat private?",
    a: "Chats are handled securely and tied to your account or anonymous session for continuity."
  },
  {
    q: "What if I have a serious issue?",
    a: "For urgent mental health, legal, medical, or financial concerns, contact a qualified professional immediately."
  },
  {
    q: "How does BhaktiGPT answer?",
    a: "Each response is structured into Reflection, Principle, Action, and Mantra or Practice."
  },
  {
    q: "Can I delete my data?",
    a: "Yes, data deletion controls can be added to account settings. For now, request support through contact page."
  }
];

const GUIDE_CARD_CONFIG: Array<{
  guideId: BhaktiGuideId;
  title: string;
  subtitle: string;
  featured?: boolean;
}> = [
  {
    guideId: "krishna",
    title: "Shri Krishna",
    subtitle: "Clarity in tough decisions",
    featured: true
  },
  {
    guideId: "shani",
    title: "Shani Dev",
    subtitle: "Discipline through setbacks"
  },
  {
    guideId: "lakshmi",
    title: "Maa Lakshmi",
    subtitle: "Prosperity with gratitude"
  }
];

export default function BhaktiGptLandingPage() {
  return (
    <div className="container pb-14 pt-4 md:pt-6">
      <BhaktiGptPageView page="landing" />
      <section className="mt-3">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-serif text-sagar-ink sm:text-5xl">
            Seek guidance from divine wisdom
          </h1>
          <p className="mt-3 text-base text-sagar-ink/75 sm:text-lg">
            Speak with AI guides inspired by sacred teachings for clarity, strength, and devotion.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GUIDE_CARD_CONFIG.map((card) => {
            const guide = BHAKTI_GUIDES[card.guideId];
            return (
              <GuideCard
                key={card.guideId}
                guideId={card.guideId}
                title={card.title}
                subtitle={card.subtitle}
                imageSrc={guide.imageSrc}
                imageAlt={guide.imageAlt}
                featured={card.featured}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/85 p-5 shadow-sagar-soft md:p-6">
        <div className="grid gap-4 text-center sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Community rating</p>
            <p className="mt-1 text-2xl font-semibold text-sagar-ink">4.8</p>
            <p className="text-sm text-sagar-ink/70">600+ devotees</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Sessions delivered</p>
            <p className="mt-1 text-2xl font-semibold text-sagar-ink">10,000+</p>
            <p className="text-sm text-sagar-ink/70">Guidance sessions</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">Global reach</p>
            <p className="mt-1 text-2xl font-semibold text-sagar-ink">25+</p>
            <p className="text-sm text-sagar-ink/70">Countries</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/45 p-4">
              <p className="text-sm text-sagar-ink/85">“{item.text}”</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-sagar-rose">
                {item.name} · {item.city}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/85 p-6 shadow-sagar-soft">
        <h2 className="text-3xl font-serif text-sagar-ink">How it works</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          <li className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/40 p-4 text-sm text-sagar-ink/80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">Step 1</p>
            <p className="mt-2">Choose a guide based on what you need today.</p>
          </li>
          <li className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/40 p-4 text-sm text-sagar-ink/80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">Step 2</p>
            <p className="mt-2">Ask what&apos;s on your mind in plain language.</p>
          </li>
          <li className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/40 p-4 text-sm text-sagar-ink/80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">Step 3</p>
            <p className="mt-2">Get Reflection, Principle, Action, and Mantra or Practice.</p>
          </li>
        </ol>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-sagar-amber/20 bg-white/85 p-5 shadow-sagar-soft">
          <h2 className="text-2xl font-serif text-sagar-ink">Rooted in tradition</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-sagar-ink/80">
            <li>Where relevant, responses can cite Gita verses for context.</li>
            <li>Guidance connects devotional practice with practical daily action.</li>
            <li>You can continue with mantras, aartis, and darshan on Bhakti Sagar.</li>
          </ul>
        </article>
        <article className="rounded-3xl border border-sagar-amber/20 bg-white/85 p-5 shadow-sagar-soft">
          <h2 className="text-2xl font-serif text-sagar-ink">Designed responsibly</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-sagar-ink/80">
            <li>No predictions, no guaranteed outcomes, and no fear-driven messaging.</li>
            <li>Medical, legal, and investing questions are redirected to professionals.</li>
            <li>Crisis language is handled with immediate safety guidance.</li>
          </ul>
        </article>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/85 p-6 shadow-sagar-soft">
        <h2 className="text-3xl font-serif text-sagar-ink">FAQ</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-2xl border border-sagar-amber/18 bg-sagar-cream/40 p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-sagar-ink">{item.q}</summary>
              <p className="mt-2 text-sm text-sagar-ink/75">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/45 px-4 py-3 text-xs text-sagar-ink/70">
        {BHAKTIGPT_DISCLAIMER}
      </section>
    </div>
  );
}
