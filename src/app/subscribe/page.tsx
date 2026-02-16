import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Seva Membership is coming | Bhakti Sagar",
  description:
    "Premium content will be reserved for members soon. Subscribe to support Bhakti Sagar and get early access.",
  pathname: "/subscribe"
});

export default function SubscribePage() {
  return (
    <div className="container py-8 md:py-12">
      <section className="rounded-[2rem] border border-sagar-amber/25 bg-gradient-to-br from-white via-sagar-cream/70 to-white p-6 shadow-sagar-soft md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sagar-rose">Seva Membership</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-serif leading-tight text-sagar-ink md:text-5xl">
          Seva Membership is coming
        </h1>
        <p className="mt-3 max-w-2xl text-base text-sagar-ink/75 md:text-lg">
          Premium content will be reserved for members soon. Subscribe now to support Bhakti Sagar
          and get early access.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="mailto:anishmadhok.in@gmail.com?subject=Seva%20Membership%20Interest"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sagar-ember"
          >
            Subscribe now
          </a>
          <a
            href="#membership-includes"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/35 bg-white px-6 py-2.5 text-sm font-semibold text-sagar-ink/80 hover:bg-sagar-cream/70"
          >
            See what&apos;s included
          </a>
        </div>
      </section>

      <section id="membership-includes" className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft">
          <h2 className="text-3xl font-serif text-sagar-ink">What you&apos;ll get</h2>
          <ul className="mt-4 space-y-2 text-sm text-sagar-ink/75">
            <li>• Full Live Darshan access with uninterrupted viewing.</li>
            <li>• Weekly Online Puja booking with priority access.</li>
            <li>• Festival specials, guided sevas, and replays.</li>
            <li>• No ads and a calmer devotional experience.</li>
            <li>• Early access to new features and content drops.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft">
          <h2 className="text-3xl font-serif text-sagar-ink">Why it matters</h2>
          <ul className="mt-4 space-y-2 text-sm text-sagar-ink/75">
            <li>• Cancel anytime.</li>
            <li>• Secure payments.</li>
            <li>• Directly supports temple seva and devotional content.</li>
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-sagar-soft">
        <h2 className="text-3xl font-serif text-sagar-ink">FAQs</h2>
        <div className="mt-4 divide-y divide-sagar-amber/20">
          {[
            {
              q: "What will membership cost?",
              a: "Pricing will be announced before premium access starts. We will keep it simple and transparent."
            },
            {
              q: "Will there be a free trial?",
              a: "Yes. We plan to offer a short free trial so you can experience the premium features before deciding."
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Membership will always be self-serve, with easy cancellation from your billing settings."
            },
            {
              q: "When does premium access start?",
              a: "We are finishing the membership experience now. Early subscribers will be notified first."
            }
          ].map((item) => (
            <details key={item.q} className="py-3">
              <summary className="cursor-pointer text-sm font-semibold text-sagar-ink/85">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-sagar-ink/75">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
