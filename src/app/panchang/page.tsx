import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Panchang",
    description:
      "Daily panchang guidance with tithi, nakshatra, and muhurat notes. Bhakti Sagar will bring simple panchang explanations and city-wise insights.",
    pathname: "/panchang"
  })
};

const faqItems = [
  {
    q: "What is a panchang?",
    a: "A panchang is a traditional Hindu calendar that notes tithi, nakshatra, yoga, karan, and sunrise/sunset timings."
  },
  {
    q: "Why do people check panchang?",
    a: "It helps choose auspicious timings for rituals, travel, and important life events."
  },
  {
    q: "Is panchang different by city?",
    a: "Yes. Panchang values depend on local sunrise and sunset, which vary by location."
  },
  {
    q: "Can I use panchang for daily prayer?",
    a: "Yes. Many devotees use it to align daily puja or aarti with favorable timings."
  },
  {
    q: "Does Bhakti Sagar provide city-wise panchang?",
    a: "We are adding it. For now, you can use Choghadiya timings for your city and check back for full panchang soon."
  }
];

export default function PanchangPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Panchang</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Daily panchang, made simple</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-sagar-ink/70">
        Panchang is the traditional Hindu calendar that guides devotees on tithi, nakshatra, yoga, karan, and
        sunrise-based timings. It is commonly used to choose auspicious windows for rituals, festivals, travel, and
        important events. Bhakti Sagar is building a calm, easy-to-read panchang experience so you can check essential
        details without wading through complicated tables.
      </p>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-sagar-ink/70">
        Our goal is to provide a simple view of today’s panchang for your city, explain what each factor means in plain
        language, and highlight key muhurats. Until the full panchang experience is live, you can still use our
        Choghadiya tool to pick a good time for your daily tasks.
      </p>

      <section className="mt-8 grid gap-4 rounded-3xl border border-sagar-amber/20 bg-white p-6 md:grid-cols-3">
        <div>
          <h2 className="text-base font-semibold text-sagar-ink">What you’ll get</h2>
          <ul className="mt-3 space-y-2 text-sm text-sagar-ink/70">
            <li>• Tithi and nakshatra with plain-language meaning</li>
            <li>• Sunrise and sunset timing for your city</li>
            <li>• Simple muhurat guidance for daily rituals</li>
            <li>• Festival-day highlights and reminders</li>
          </ul>
        </div>
        <div>
          <h3 className="text-base font-semibold text-sagar-ink">Use it with</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-sagar-ink/70">
            <Link
              href="/choghadiya"
              className="rounded-full border border-sagar-amber/40 px-3 py-1 hover:text-sagar-saffron"
            >
              Choghadiya timings
            </Link>
            <Link
              href="/aartis"
              className="rounded-full border border-sagar-amber/40 px-3 py-1 hover:text-sagar-saffron"
            >
              Aarti collection
            </Link>
            <Link
              href="/festival"
              className="rounded-full border border-sagar-amber/40 px-3 py-1 hover:text-sagar-saffron"
            >
              Festival guides
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-base font-semibold text-sagar-ink">Next up</h3>
          <p className="mt-3 text-sm text-sagar-ink/70">
            We are adding city-wise panchang views with clear explanations. This will include tithi, nakshatra, and
            simple daily guidance tailored to your location.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-6" id="faq">
        <h2 className="text-xl font-serif text-sagar-ink">Panchang FAQs</h2>
        <div className="mt-4 space-y-4 text-sm text-sagar-ink/70">
          {faqItems.map((item) => (
            <div key={item.q}>
              <h3 className="font-semibold text-sagar-ink">{item.q}</h3>
              <p className="mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", url: "https://bhakti-sagar.com/" },
              { name: "Panchang", url: "https://bhakti-sagar.com/panchang" }
            ])
          )
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />
    </div>
  );
}
