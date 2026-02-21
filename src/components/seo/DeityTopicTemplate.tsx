import Link from "next/link";
import RelatedHindiLinks from "@/components/RelatedHindiLinks";
import {
  DEITY_CHAT_GUIDE,
  DEITY_DISPLAY_NAME,
  getFaqForLocale,
  getLocaleText,
  getTopicContent,
  type DeitySlug,
  type Locale
} from "@/lib/hindiSeoContent";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/schema";
import { siteConfig } from "@/lib/seo";
import { notFound } from "next/navigation";

export default function DeityTopicTemplate({
  deity,
  topic,
  locale
}: {
  deity: DeitySlug;
  topic: string;
  locale: Locale;
}) {
  const content = getTopicContent(deity, topic);

  if (!content) {
    notFound();
  }

  const deityName = getLocaleText(DEITY_DISPLAY_NAME[deity], locale);
  const pagePath = `/${locale}/${deity}/${topic}`;
  const hubPath = `/${locale}/${deity}`;
  const faqItems = getFaqForLocale(content.faqs, locale);

  const breadcrumbSchema = breadcrumbJsonLd([
    {
      name: locale === "hi" ? "होम" : "Home",
      url: `${siteConfig.url}/${locale}`
    },
    {
      name: deityName,
      url: `${siteConfig.url}${hubPath}`
    },
    {
      name: getLocaleText(content.h1, locale),
      url: `${siteConfig.url}${pagePath}`
    }
  ]);

  const faqSchema = faqJsonLd(faqItems);
  const articleSchema = articleJsonLd({
    headline: getLocaleText(content.h1, locale),
    description: getLocaleText(content.description, locale),
    url: `${siteConfig.url}${pagePath}`,
    datePublished: content.publishedAt,
    dateModified: content.updatedAt,
    authorName: "Bhakti Chat"
  });
  const pageSchema = webPageJsonLd({
    name: getLocaleText(content.title, locale),
    description: getLocaleText(content.description, locale),
    url: `${siteConfig.url}${pagePath}`,
    inLanguage: locale === "hi" ? "hi-IN" : "en"
  });

  const siblingLinks = [
    { href: `/${locale}/${deity}`, label: locale === "hi" ? `${deityName} हब` : `${deityName} hub` },
    { href: `/${locale}/bhaktigpt/chat?guide=${DEITY_CHAT_GUIDE[deity]}`, label: locale === "hi" ? `${deityName} चैट` : `${deityName} chat` }
  ];

  return (
    <article className="container py-10 md:py-12">
      <nav className="mb-4 text-xs text-sagar-ink/60">
        <Link href={`/${locale}`} className="hover:text-sagar-saffron">
          {locale === "hi" ? "होम" : "Home"}
        </Link>
        <span className="mx-2">/</span>
        <Link href={hubPath} className="hover:text-sagar-saffron">
          {deityName}
        </Link>
        <span className="mx-2">/</span>
        <span>{getLocaleText(content.h1, locale)}</span>
      </nav>

      <h1 className="text-3xl font-serif text-sagar-ink md:text-4xl">{getLocaleText(content.h1, locale)}</h1>
      <p className="mt-3 text-sm text-sagar-ink/75 md:text-base">{getLocaleText(content.intro, locale)}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {siblingLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-sagar-amber/25 px-4 py-1.5 text-xs font-semibold text-sagar-ember hover:border-sagar-saffron"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <section className="mt-8 space-y-7">
        {content.sections.map((section) => (
          <div key={`${content.slug}-${section.heading.hi}`} className="rounded-2xl border border-sagar-amber/20 bg-white/85 p-5">
            <h2 className="text-xl font-serif text-sagar-ink">{getLocaleText(section.heading, locale)}</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-sagar-ink/80 md:text-base">
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${content.slug}-section-${index}`}>{getLocaleText(paragraph, locale)}</p>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/85 p-5">
        <h2 className="text-xl font-serif text-sagar-ink">{getLocaleText(content.howToHeading, locale)}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-sagar-ink/80 md:text-base">
          {content.howToSteps.map((step, index) => (
            <li key={`${content.slug}-step-${index}`}>{getLocaleText(step, locale)}</li>
          ))}
        </ol>
      </section>

      {content.disclaimer ? (
        <section className="mt-6 rounded-2xl border border-sagar-amber/25 bg-sagar-cream/50 p-4 text-sm text-sagar-ink/80">
          {getLocaleText(content.disclaimer, locale)}
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/85 p-5">
        <h2 className="text-xl font-serif text-sagar-ink">{locale === "hi" ? "अक्सर पूछे सवाल" : "Frequently asked questions"}</h2>
        <div className="mt-4 space-y-3 text-sm text-sagar-ink/80 md:text-base">
          {faqItems.map((item) => (
            <details key={item.q} className="rounded-xl border border-sagar-amber/20 bg-white/80 p-4">
              <summary className="cursor-pointer font-semibold text-sagar-ink">{item.q}</summary>
              <p className="mt-2 leading-7">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <Link
          href={`/${locale}/bhaktigpt/chat?guide=${DEITY_CHAT_GUIDE[deity]}`}
          className="inline-flex rounded-full bg-sagar-saffron px-5 py-2 text-sm font-semibold text-white"
        >
          {locale === "hi" ? `${deityName} से अभी बात करें` : `Talk to ${deityName}`}
        </Link>
      </section>

      <RelatedHindiLinks deity={deity} locale={locale} currentPath={pagePath} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </article>
  );
}
