import Image from "next/image";
import Link from "next/link";
import BhaktiGptPageView from "@/components/bhaktigpt/BhaktiGptPageView";
import { BHAKTI_GUIDES } from "@/lib/bhaktigpt/guides";
import { buildBhaktiChatHref } from "@/lib/bhaktigpt/chatLinks";
import { HOME_COPY, type HomeLang } from "@/lib/homeCopy";

type HomePageContentProps = {
  lang: HomeLang;
};

export default function HomePageContent({ lang }: HomePageContentProps) {
  const copy = HOME_COPY[lang];
  const isHinglish = lang === "hinglish";

  const deityCards = [
    {
      id: "krishna" as const,
      title: copy.featured_krishna_title,
      description: copy.featured_krishna_desc
    },
    {
      id: "lakshmi" as const,
      title: copy.featured_lakshmi_title,
      description: copy.featured_lakshmi_desc
    },
    {
      id: "shani" as const,
      title: copy.featured_shani_title,
      description: copy.featured_shani_desc
    }
  ];

  const trustItems = [
    { title: copy.trust_1_title, description: copy.trust_1_desc },
    { title: copy.trust_2_title, description: copy.trust_2_desc },
    { title: copy.trust_3_title, description: copy.trust_3_desc }
  ];

  const metrics = [
    { label: copy.rating_label, value: copy.rating_value, detail: copy.rating_desc },
    { label: copy.stats_1_label, value: copy.stats_1_value, detail: copy.stats_2_label },
    { label: copy.stats_3_label, value: copy.stats_3_value, detail: copy.stats_3_suffix }
  ];

  const testimonials = [
    { quote: copy.testimonial_1, author: copy.testimonial_1_meta },
    { quote: copy.testimonial_2, author: copy.testimonial_2_meta },
    { quote: copy.testimonial_3, author: copy.testimonial_3_meta }
  ];

  return (
    <div className="container page-reveal pb-16 pt-4 sm:pt-6">
      <BhaktiGptPageView page="landing" />

      <section className="surface-panel relative overflow-hidden rounded-[2rem] px-4 pb-7 pt-6 sm:px-6 md:px-8 md:pb-9 md:pt-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(241,192,110,0.26),transparent_34%),radial-gradient(circle_at_14%_82%,rgba(180,58,40,0.08),transparent_40%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <h1
            className={`text-sagar-ink ${
              isHinglish
                ? "mx-auto max-w-4xl text-3xl leading-tight sm:text-[2.45rem] lg:text-[3rem]"
                : "mx-auto max-w-5xl text-3xl leading-tight sm:text-[2.55rem] lg:text-[3.3rem]"
            }`}
          >
            {copy.hero_title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-sagar-ink/72 sm:text-[1.06rem]">
            {copy.hero_subtitle}
          </p>
        </div>

        <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-3">
          {deityCards.map((card, index) => {
            const guide = BHAKTI_GUIDES[card.id];
            return (
              <Link
                key={card.id}
                href={buildBhaktiChatHref({
                  guideId: card.id,
                  chatLang: lang === "en" ? undefined : lang
                })}
                style={{ animationDelay: `${index * 120}ms` }}
                className="animate-fade-in-up hover-lift group relative block h-full min-h-[380px] overflow-hidden rounded-[1.6rem] border border-sagar-amber/22 bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sagar-saffron/60 sm:min-h-[428px] lg:min-h-[458px]"
              >
                <Image
                  src={guide.imageSrc}
                  alt={guide.imageAlt}
                  fill
                  priority={index < 2}
                  className="object-cover object-center transition duration-300 group-hover:scale-[1.025]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#251006]/93 via-[#3b1a0b]/38 to-transparent" />
                {card.id === "krishna" ? (
                  <span className="absolute left-4 top-4 inline-flex rounded-full border border-white/35 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                    {copy.featured_label}
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="rounded-[1.2rem] border border-white/22 bg-black/34 px-3 py-2.5 backdrop-blur-[1px]">
                    <p className="text-[1.8rem] font-semibold leading-[1.05] text-white [text-shadow:0_3px_14px_rgba(0,0,0,0.7)] sm:text-[2.02rem]">
                      {card.title}
                    </p>
                    <p className="mt-1 text-sm text-white/95 [text-shadow:0_1px_10px_rgba(0,0,0,0.75)] sm:text-[15px]">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="surface-panel mt-6 rounded-[1.7rem] px-3 py-3 md:px-4">
        <div className="grid gap-3 md:grid-cols-3">
          {trustItems.map((item, index) => (
            <article
              key={item.title}
              style={{ animationDelay: `${300 + index * 80}ms` }}
              className="animate-fade-in-up surface-soft rounded-[1rem] px-3 py-3.5 transition-colors duration-200 hover:border-sagar-amber/35"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sagar-amber/35 bg-white text-sagar-ember">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                    <path
                      d="M12 3l7 3v5c0 5.2-3.4 8.9-7 10-3.6-1.1-7-4.8-7-10V6l7-3zM9.8 12.1l1.8 1.9 3.6-3.8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-sagar-ink">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-sagar-ink/72">{item.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel mt-8 rounded-[1.85rem] p-4 sm:p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-3">
          {metrics.map((item, index) => (
            <article key={item.label} style={{ animationDelay: `${index * 80}ms` }} className="animate-fade-in-up rounded-[1.2rem] border border-sagar-amber/15 bg-white/62 p-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sagar-rose">{item.label}</p>
              <p className="mt-2 text-[2.1rem] font-semibold leading-none text-sagar-ink">{item.value}</p>
              <p className="mt-2 text-sm text-sagar-ink/70">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <article
              key={item.author}
              style={{ animationDelay: `${index * 80}ms` }}
              className="animate-fade-in-up surface-soft rounded-[1.1rem] p-4 transition-colors duration-200 hover:border-sagar-amber/35"
            >
              <p className="text-sm leading-relaxed text-sagar-ink/84">{item.quote}</p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sagar-rose">
                {item.author}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel mt-8 rounded-[1.7rem] p-5 md:p-6">
        <h2 className="text-[1.75rem] leading-tight text-sagar-ink">{copy.disclaimer_title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sagar-ink/76">{copy.disclaimer_desc}</p>
      </section>

      <section className="surface-soft mt-8 rounded-[1.2rem] px-4 py-3 text-xs text-sagar-ink/72">
        <p className="flex flex-wrap items-center gap-2">
          <span>{copy.more_tools_label}</span>
          <Link href="/aartis" className="font-semibold text-sagar-ember hover:text-sagar-saffron">
            {copy.tools_aartis}
          </Link>
          <span className="text-sagar-ink/40">·</span>
          <Link href="/choghadiya" className="font-semibold text-sagar-ember hover:text-sagar-saffron">
            {copy.tools_choghadiya}
          </Link>
        </p>
      </section>

      <section className="surface-panel mt-8 rounded-[1.4rem] p-5 md:p-6">
        <h2 className="text-[1.35rem] leading-tight text-sagar-ink">{copy.hubs_title}</h2>
        <p className="mt-2 text-sm text-sagar-ink/74">{copy.hubs_desc}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href="/krishna"
            className="rounded-full border border-sagar-amber/25 bg-white/75 px-3 py-1.5 text-sagar-ember hover:border-sagar-saffron/45 hover:text-sagar-saffron"
          >
            {copy.hub_krishna}
          </Link>
          <Link
            href="/lakshmi"
            className="rounded-full border border-sagar-amber/25 bg-white/75 px-3 py-1.5 text-sagar-ember hover:border-sagar-saffron/45 hover:text-sagar-saffron"
          >
            {copy.hub_lakshmi}
          </Link>
          <Link
            href="/shani"
            className="rounded-full border border-sagar-amber/25 bg-white/75 px-3 py-1.5 text-sagar-ember hover:border-sagar-saffron/45 hover:text-sagar-saffron"
          >
            {copy.hub_shani}
          </Link>
        </div>
      </section>
    </div>
  );
}
