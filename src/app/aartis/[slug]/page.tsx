import { notFound } from "next/navigation";
import AartiLyricsPanel from "@/components/AartiLyricsPanel";
import MeaningPanel from "@/components/MeaningPanel";
import ShareButton from "@/components/ShareButton";
import AskAIPanel from "@/components/AskAIPanel";
import { getAartiBySlug, getAartis, getCategories } from "@/lib/data";
import { getYouTubeEmbedUrl, getYouTubeId } from "@/lib/youtube";
import type { Metadata } from "next";
import { siteConfig, toDescription, toTitle } from "@/lib/seo";

export function generateStaticParams() {
  return getAartis().map((aarti) => ({ slug: aarti.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const aarti = getAartiBySlug(params.slug);
  if (!aarti) {
    return {
      title: toTitle("Aarti")
    };
  }
  const title = aarti.title.english || aarti.title.hindi;
  const description = `Read the lyrics and meaning of ${title} in English and Hindi.`;
  return {
    title: toTitle(`${title} Lyrics (English) | Aarti Video | Meaning`),
    description: toDescription(
      `Read ${title} lyrics in English letters, meaning, and watch the aarti video. Easy to read and mobile friendly.`
    ),
    alternates: {
      canonical: `https://bhakti-sagar.com/aartis/${aarti.slug}`
    },
    openGraph: {
      title: toTitle(`${title} Lyrics (English) | Aarti Video | Meaning`),
      description: toDescription(
        `Read ${title} lyrics in English letters, meaning, and watch the aarti video. Easy to read and mobile friendly.`
      ),
      url: `https://bhakti-sagar.com/aartis/${aarti.slug}`,
      images: [{ url: siteConfig.ogImage }]
    },
    twitter: {
      card: "summary_large_image",
      title: toTitle(`${title} Lyrics (English) | Aarti Video | Meaning`),
      description: toDescription(
        `Read ${title} lyrics in English letters, meaning, and watch the aarti video. Easy to read and mobile friendly.`
      ),
      images: [siteConfig.ogImage]
    }
  };
}

export default function AartiDetailPage({ params }: { params: { slug: string } }) {
  const aarti = getAartiBySlug(params.slug);
  if (!aarti) {
    notFound();
  }

  const category = getCategories().find((item) => item.slug === aarti.category);
  const embedUrl = getYouTubeEmbedUrl(aarti.youtubeUrl);
  const titleDisplay = aarti.title.english || aarti.title.hindi;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: titleDisplay,
    description: `Lyrics and meaning for ${titleDisplay}.`,
    inLanguage: ["en", "hi"],
    url: `https://bhakti-sagar.com/aartis/${aarti.slug}`
  };
  const videoId = getYouTubeId(aarti.youtubeUrl);
  if (videoId) {
    jsonLd.associatedMedia = {
      "@type": "VideoObject",
      name: `${titleDisplay} Aarti`,
      url: aarti.youtubeUrl,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
  }
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://bhakti-sagar.com/"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Aartis",
        item: "https://bhakti-sagar.com/aartis"
      },
      {
        "@type": "ListItem",
        position: 3,
        name: titleDisplay,
        item: `https://bhakti-sagar.com/aartis/${aarti.slug}`
      }
    ]
  };
  const faqItems = [
    {
      q: `What is ${titleDisplay}?`,
      a: `${titleDisplay} is a devotional aarti sung during prayer to honor the deity.`
    },
    {
      q: `Is ${titleDisplay} available in English?`,
      a: `Yes, you can read ${titleDisplay} in English letters (transliteration) and in Hindi.`
    },
    {
      q: `When is ${titleDisplay} usually sung?`,
      a: `It is commonly sung during daily pooja, temple visits, and festivals related to the deity.`
    },
    {
      q: `How do I perform this aarti?`,
      a: `Light a diya, offer flowers or prasad, and sing the aarti with devotion.`
    },
    {
      q: `Can I understand the meaning of each line?`,
      a: `Yes, use the AI Insight panel for a summary or line-by-line meaning.`
    },
    {
      q: `Does this page include a video?`,
      a: `Yes, when available you can watch the aarti video alongside the lyrics.`
    }
  ];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a }
    }))
  };

  return (
    <div className="container py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">
        <div className="flex flex-wrap items-center gap-3">
          <span>{category?.name ?? "Aarti"}</span>
          <span className="h-1 w-1 rounded-full bg-sagar-rose" />
          <span>{aarti.isTop ? "Top Aarti" : "Prayer"}</span>
        </div>
        <ShareButton title={titleDisplay} />
      </div>

      <h1 className="mt-4 text-4xl font-serif text-sagar-ink md:text-5xl">{titleDisplay}</h1>
      {aarti.title.hindi && aarti.title.english && (
        <p className="mt-2 text-lg text-sagar-ink/70">{aarti.title.hindi}</p>
      )}
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        Sing along with the lyrics and open the meaning panel for a gentle explanation.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-card">
          <AartiLyricsPanel title={aarti.title} lyrics={aarti.lyrics} />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-4 shadow-sagar-soft">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-sagar-rose">When to do this aarti</h3>
              <p className="mt-2 text-sm text-sagar-ink/70">
                Often sung during daily prayer, temple visits, and festival poojas dedicated to {titleDisplay}.
              </p>
            </div>
            <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-4 shadow-sagar-soft">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-sagar-rose">How to do aarti</h3>
              <p className="mt-2 text-sm text-sagar-ink/70">
                Light a diya, offer flowers or prasad, and sing the aarti with devotion while circling the lamp.
              </p>
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
            <h3 className="text-lg font-serif text-sagar-ink">FAQ</h3>
            <div className="mt-4 space-y-4 text-sm text-sagar-ink/70">
              {faqItems.map((item) => (
                <div key={item.q}>
                  <p className="font-semibold text-sagar-ink">{item.q}</p>
                  <p className="mt-1">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-3xl border border-sagar-amber/20 bg-white/80 p-4 shadow-sagar-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Video</p>
            <h2 className="mt-2 text-lg font-serif text-sagar-ink">Listen & sing along</h2>
            <div className="mt-4">
              {embedUrl ? (
                <div className="aspect-video overflow-hidden rounded-2xl bg-sagar-cream/70">
                  <iframe
                    src={embedUrl}
                    title={`${titleDisplay} Aarti Video`}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-sagar-amber/40 bg-sagar-cream/60">
                  <p className="text-sm text-sagar-ink/60">Add a YouTube URL to show the video.</p>
                </div>
              )}
            </div>
          </div>
          <AskAIPanel title={titleDisplay} lyrics={aarti.lyrics.english.length ? aarti.lyrics.english : aarti.lyrics.hindi} />
          <MeaningPanel title={titleDisplay} lyrics={aarti.lyrics.english.length ? aarti.lyrics.english : aarti.lyrics.hindi} />
        </aside>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
