import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BHAKTI_GUIDE_LIST, BHAKTIGPT_DISCLAIMER } from "@/lib/bhaktigpt/guides";
import { buildMetadata } from "@/lib/seo";
import BhaktiTrackedLink from "@/components/bhaktigpt/BhaktiTrackedLink";
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

export default function BhaktiGptLandingPage() {
  return (
    <div className="container pb-14 pt-4 md:pt-6">
      <BhaktiGptPageView page="landing" />
      <section className="rounded-3xl border border-sagar-amber/20 bg-gradient-to-br from-[#fff8ee] via-[#fff4e7] to-[#f8e2c7] p-6 shadow-sagar-soft md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sagar-rose">BhaktiGPT</p>
        <h1 className="mt-2 max-w-[18ch] text-4xl font-serif leading-tight text-sagar-ink sm:text-5xl">
          Guidance for life, rooted in dharma.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-sagar-ink/80">
          BhaktiGPT is an AI guide inspired by Shani Dev, Goddess Lakshmi, and Shri Krishna&apos;s Gita teachings. It helps you reflect, find clarity, and take the next right step.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <BhaktiTrackedLink
            href="/bhaktigpt/chat"
            eventName="viewed_bhaktigpt"
            eventParams={{ action: "start_chat_click", source: "hero" }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sagar-ember"
          >
            Start BhaktiGPT
          </BhaktiTrackedLink>
          <a
            href="#how-it-works"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-amber/35 bg-white px-6 py-2.5 text-sm font-semibold text-sagar-ink/80 transition hover:bg-sagar-cream/60"
          >
            How it works
          </a>
        </div>
      </section>

      <section className="mt-5 grid gap-3 rounded-3xl border border-sagar-amber/20 bg-white/85 p-4 text-sm text-sagar-ink/80 shadow-sagar-soft sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/50 px-3 py-3">Inspired by scriptures and tradition</div>
        <div className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/50 px-3 py-3">Private chats, secure by design</div>
        <div className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/50 px-3 py-3">Used by devotees worldwide</div>
        <div className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/50 px-3 py-3">No fear, no predictions</div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-3xl font-serif text-sagar-ink">Seek guidance from divine avatars</h2>
          <Link href="/bhaktigpt/chat" className="text-sm font-semibold text-sagar-ember hover:text-sagar-saffron">Open chat</Link>
        </div>
        <p className="mt-2 text-sm text-sagar-ink/70">
          Speak with AI guides inspired by dharmic teachings for wisdom, reflection, and next-step clarity.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {BHAKTI_GUIDE_LIST.map((guide) => {
            const isKrishna = guide.id === "krishna";
            return (
              <BhaktiTrackedLink
                key={guide.id}
                href={`/bhaktigpt/chat?guide=${guide.id}`}
                eventName="selected_guide"
                eventParams={{ guideId: guide.id, source: "landing_card" }}
                className={`group block overflow-hidden rounded-3xl border border-sagar-amber/22 bg-white/90 shadow-sagar-soft transition hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(65,30,10,0.45)] ${
                  isKrishna ? "lg:col-span-2" : ""
                }`}
              >
                <div className={`relative overflow-hidden ${isKrishna ? "aspect-[16/9]" : "aspect-[4/5]"}`}>
                <Image
                  src={guide.imageSrc}
                  alt={guide.imageAlt}
                  fill
                  sizes={isKrishna ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 1024px) 100vw, 33vw"}
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  priority={isKrishna}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2f1408]/90 via-[#2f1408]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  {isKrishna ? (
                    <span className="mb-2 inline-flex rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                      Featured Guide
                    </span>
                  ) : null}
                  <h3 className="text-2xl font-serif text-white">{guide.name}</h3>
                  <p className="mt-1 text-sm text-white/85">{guide.subtitle}</p>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-sagar-ink/78">{guide.shortDescription}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {guide.promptChips.slice(0, 2).map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-sagar-amber/28 bg-sagar-cream/45 px-3 py-1 text-xs text-sagar-ink/85"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <span className="mt-4 inline-flex min-h-[42px] items-center justify-center rounded-full bg-sagar-saffron px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-sagar-ember">
                  Connect with {guide.name}
                </span>
              </div>
              </BhaktiTrackedLink>
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
