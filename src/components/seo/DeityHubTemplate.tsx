import Link from "next/link";
import RelatedHindiLinks from "@/components/RelatedHindiLinks";
import {
  DEITY_CHAT_GUIDE,
  DEITY_DISPLAY_NAME,
  getFaqForLocale,
  getHubContent,
  getLocaleText,
  type DeitySlug,
  type Locale
} from "@/lib/hindiSeoContent";
import { breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/schema";
import { siteConfig } from "@/lib/seo";

export default function DeityHubTemplate({ deity, locale }: { deity: DeitySlug; locale: Locale }) {
  const content = getHubContent(deity);
  const displayName = getLocaleText(DEITY_DISPLAY_NAME[deity], locale);
  const hubPath = `/${locale}/${content.slug}`;
  const faqItems = getFaqForLocale(content.faqs, locale);
  const breadcrumbs = breadcrumbJsonLd([
    {
      name: locale === "hi" ? "होम" : "Home",
      url: `${siteConfig.url}/${locale}`
    },
    {
      name: displayName,
      url: `${siteConfig.url}${hubPath}`
    }
  ]);
  const pageSchema = webPageJsonLd({
    name: getLocaleText(content.title, locale),
    description: getLocaleText(content.description, locale),
    url: `${siteConfig.url}${hubPath}`,
    inLanguage: locale === "hi" ? "hi-IN" : "en"
  });
  const faqSchema = faqJsonLd(faqItems);

  return (
    <div className="container py-10 md:py-12">
      <nav className="mb-4 text-xs text-sagar-ink/60">
        <Link href={`/${locale}`} className="hover:text-sagar-saffron">
          {locale === "hi" ? "होम" : "Home"}
        </Link>
        <span className="mx-2">/</span>
        <span>{displayName}</span>
      </nav>

      <h1 className="text-3xl font-serif text-sagar-ink md:text-4xl">{getLocaleText(content.h1, locale)}</h1>
      <p className="mt-3 text-sm text-sagar-ink/75 md:text-base">{getLocaleText(content.description, locale)}</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-sagar-ink/80 md:text-base">
        {content.introParagraphs.map((paragraph, index) => (
          <p key={`${content.slug}-intro-${index}`}>{getLocaleText(paragraph, locale)}</p>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/85 p-5">
        <h2 className="text-xl font-serif text-sagar-ink">{locale === "hi" ? "किसके लिए" : "Who this is for"}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-sagar-ink/80 md:text-base">
          {content.forWhom.map((item, index) => (
            <li key={`${content.slug}-who-${index}`}>{getLocaleText(item, locale)}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/85 p-5">
        <h2 className="text-xl font-serif text-sagar-ink">{locale === "hi" ? "आज क्या पूछें" : "What to ask today"}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-sagar-ink/80 md:text-base">
          {content.askToday.map((item, index) => (
            <li key={`${content.slug}-ask-${index}`}>{getLocaleText(item, locale)}</li>
          ))}
        </ul>
        <Link
          href={`/${locale}/bhaktigpt/chat?guide=${DEITY_CHAT_GUIDE[deity]}`}
          className="mt-5 inline-flex rounded-full bg-sagar-saffron px-5 py-2 text-sm font-semibold text-white"
        >
          {getLocaleText(content.ctaLabel, locale)}
        </Link>
      </section>

      <section className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/85 p-5">
        <h2 className="text-xl font-serif text-sagar-ink">{locale === "hi" ? "मंत्र और आरती" : "Mantra and aarti"}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {content.mantraAndAartiLinks.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className="rounded-xl border border-sagar-amber/20 bg-sagar-cream/50 px-4 py-3 text-sm font-semibold text-sagar-ember hover:text-sagar-saffron"
            >
              {getLocaleText(item.label, locale)}
            </Link>
          ))}
        </div>
      </section>

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

      <RelatedHindiLinks deity={deity} locale={locale} currentPath={hubPath} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </div>
  );
}
