import { notFound } from "next/navigation";
import AartiLyricsPanel from "@/components/AartiLyricsPanel";
import MeaningPanel from "@/components/MeaningPanel";
import ShareButton from "@/components/ShareButton";
import PrintButton from "@/components/PrintButton";
import CopyLinkButton from "@/components/CopyLinkButton";
import MobileContentsDrawer from "@/components/MobileContentsDrawer";
import { getAartiBySlug, getAartis, getAartisByCategory, getCategories } from "@/lib/data";
import { festivals } from "@/lib/content";
import { getYouTubeEmbedUrl, getYouTubeId } from "@/lib/youtube";
import type { Metadata } from "next";
import { buildMetadata, getRequestLanguage, siteConfig } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, videoObjectJsonLd } from "@/lib/schema";
import { getAuthorBySlug } from "@/lib/authors";

export function generateStaticParams() {
  return getAartis().map((aarti) => ({ slug: aarti.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const aarti = getAartiBySlug(params.slug);
  if (!aarti) {
    return buildMetadata({
      title: "Aarti",
      description: "Read devotional aarti lyrics with meaning and video.",
      pathname: `/aartis/${params.slug}`
    });
  }
  const title = aarti.title.english || aarti.title.hindi;
  if (aarti.slug === "shri-shiv-ji-ki-aarati") {
    return buildMetadata({
      title: "Om Jai Shiv Omkara Lyrics (English & Hindi) | Maha Shivratri Aarti Meaning",
      description:
        "Read Om Jai Shiv Omkara lyrics in English and Hindi with meaning and video. Popular Shiv Ji ki Aarti for Maha Shivratri and daily Shiva pooja.",
      pathname: `/aartis/${aarti.slug}`,
      ogImage: siteConfig.ogImage
    });
  }
  return buildMetadata({
    title: `${title} Lyrics (English) | Aarti Video | Meaning`,
    description: `Read ${title} lyrics in English letters, meaning, and watch the aarti video. Easy to read and mobile friendly.`,
    pathname: `/aartis/${aarti.slug}`,
    ogImage: siteConfig.ogImage
  });
}

export default function AartiDetailPage({ params }: { params: { slug: string } }) {
  const aarti = getAartiBySlug(params.slug);
  if (!aarti) {
    notFound();
  }

  const lang = getRequestLanguage();
  const category = getCategories().find((item) => item.slug === aarti.category);
  const embedUrl = getYouTubeEmbedUrl(aarti.youtubeUrl);
  const titleDisplay = lang === "hi" ? aarti.title.hindi || aarti.title.english : aarti.title.english || aarti.title.hindi;
  const subtitle = lang === "hi" ? aarti.title.english : aarti.title.hindi;
  const author = getAuthorBySlug("anish-madhok");
  const datePublished = "2024-10-01";
  const dateModified = "2026-02-05";
  const aartiUrl = `https://bhakti-sagar.com/aartis/${aarti.slug}`;
  const videoId = getYouTubeId(aarti.youtubeUrl);
  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Aartis", url: "https://bhakti-sagar.com/aartis" },
    { name: titleDisplay, url: aartiUrl }
  ]);
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
  const faqData = faqJsonLd(faqItems);
  const articleData = articleJsonLd({
    headline: `${titleDisplay} Aarti Lyrics`,
    description: `Lyrics, meaning, and video for ${titleDisplay}.`,
    url: aartiUrl,
    datePublished,
    dateModified,
    authorName: author?.name ?? "Bhakti Sagar",
    image: siteConfig.ogImage
  });
  const videoData = videoId
    ? videoObjectJsonLd({
        name: `${titleDisplay} Aarti`,
        description: `Watch and sing along with ${titleDisplay}.`,
        url: aarti.youtubeUrl,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      })
    : null;

  const relatedByDeity = getAartisByCategory(aarti.category)
    .filter((item) => item.slug !== aarti.slug)
    .slice(0, 6);
  const moreAartis = getAartis()
    .filter((item) => item.slug !== aarti.slug)
    .slice(0, 6);
  const relatedFestivals = festivals.filter((festival) => festival.categories.includes(aarti.category)).slice(0, 3);
  const contents = [
    { id: "lyrics", label: "Lyrics" },
    { id: "meaning", label: "AI Summary" },
    { id: "how-to", label: "How to do aarti" },
    { id: "faq", label: "FAQ" },
    { id: "related", label: "Related prayers" }
  ];

  return (
    <div className="container py-10 pb-24">
      <div className="hidden flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose sm:flex">
        <div className="flex flex-wrap items-center gap-3">
          <span>{category?.name ?? "Aarti"}</span>
          <span className="h-1 w-1 rounded-full bg-sagar-rose" />
          <span>{aarti.isTop ? "Top Aarti" : "Prayer"}</span>
        </div>
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          <PrintButton />
          <ShareButton title={titleDisplay} />
        </div>
      </div>

      <div className="mt-2 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-serif text-sagar-ink sm:text-4xl md:text-5xl">{titleDisplay}</h1>
      </div>
      {subtitle && (
        <p className="mt-1 hidden text-sm text-sagar-ink/70 sm:block sm:text-base">{subtitle}</p>
      )}
      <div className="mt-2 hidden text-xs text-sagar-ink/60 sm:block">
        <span>{category?.name ?? "Aarti"}</span>
        <span className="mx-2">•</span>
        <span>{lang === "hi" ? "Hindi" : "English"}</span>
      </div>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="order-1 rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-none lg:shadow-sagar-card">
          <div className="hidden rounded-2xl border border-sagar-amber/20 bg-sagar-cream/50 p-4 lg:block aarti-secondary">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">On this page</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-sagar-ink/70">
              <a href="#lyrics" className="hover:text-sagar-saffron">Lyrics</a>
              <a href="#meaning" className="hover:text-sagar-saffron">AI summary</a>
              <a href="#how-to" className="hover:text-sagar-saffron">How to do aarti</a>
              <a href="#faq" className="hover:text-sagar-saffron">FAQ</a>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between lg:hidden aarti-secondary">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60">Contents</p>
            <MobileContentsDrawer sections={contents} triggerLabel="Contents" />
          </div>
          <div id="lyrics" className="scroll-mt-24">
            <AartiLyricsPanel
              title={aarti.title}
              lyrics={aarti.lyrics}
              slug={aarti.slug}
              aartiUrl={aartiUrl}
              initialLanguage={lang === "hi" ? "hindi" : "english"}
            />
          </div>
          <div className="mt-6 space-y-4 aarti-secondary">
            <details className="rounded-2xl border border-sagar-amber/20 bg-white p-4" id="video">
              <summary className="cursor-pointer text-sm font-semibold text-sagar-ink">Video</summary>
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
            </details>
            <details id="meaning" className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-sagar-ink">AI Summary</summary>
              <div className="mt-4">
                <MeaningPanel
                  title={titleDisplay}
                  lyrics={
                    lang === "hi" && aarti.lyrics.hindi.length
                      ? aarti.lyrics.hindi
                      : aarti.lyrics.english.length
                      ? aarti.lyrics.english
                      : aarti.lyrics.hindi
                  }
                />
              </div>
            </details>
          </div>
          <div id="how-to" className="mt-8 grid gap-4 md:grid-cols-2 scroll-mt-24">
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
          <div id="faq" className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white p-6 scroll-mt-24 lg:shadow-sagar-soft">
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
      </div>
      <div className="mt-6 space-y-4 aarti-secondary">
        <details className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-sagar-ink">Share & details</summary>
          <div className="mt-4 flex flex-wrap gap-2">
            <ShareButton title={titleDisplay} />
            <CopyLinkButton />
            <PrintButton />
          </div>
          <div className="mt-4 text-xs text-sagar-ink/60">
            <p>Last updated: Feb 5, 2026</p>
            <p>Reviewed by: {author?.name ?? "Bhakti Sagar"}</p>
          </div>
        </details>
      </div>
      <div id="related" className="mt-12 grid gap-6 md:grid-cols-2 aarti-secondary">
        <div className="rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-soft">
          <h3 className="text-lg font-serif text-sagar-ink">More prayers for {category?.name ?? "this deity"}</h3>
          <div className="mt-4 grid gap-2 text-sm text-sagar-ink/70">
            {relatedByDeity.map((item) => (
              <a key={item.id} href={`/aartis/${item.slug}`} className="hover:text-sagar-saffron">
                {item.title.english || item.title.hindi}
              </a>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-soft">
          <h3 className="text-lg font-serif text-sagar-ink">More aartis to explore</h3>
          <div className="mt-4 grid gap-2 text-sm text-sagar-ink/70">
            {moreAartis.map((item) => (
              <a key={item.id} href={`/aartis/${item.slug}`} className="hover:text-sagar-saffron">
                {item.title.english || item.title.hindi}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-soft aarti-secondary">
        <h3 className="text-lg font-serif text-sagar-ink">About {category?.name ?? "the deity"}</h3>
        <p className="mt-3 text-sm text-sagar-ink/70">
          {category?.name ?? "This deity"} is honored in Hindu tradition with prayers, aartis, and devotional
          songs. Devotees sing these verses to offer gratitude, seek blessings, and cultivate devotion.
        </p>
      </div>
      {relatedFestivals.length > 0 && (
        <div className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-soft aarti-secondary">
          <h3 className="text-lg font-serif text-sagar-ink">Related festivals</h3>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-sagar-ink/70">
            {relatedFestivals.map((festival) => (
              <a
                key={festival.slug}
                href={`/festival/${festival.slug}`}
                className="rounded-full border border-sagar-amber/30 px-3 py-1 hover:text-sagar-saffron"
              >
                {festival.name}
              </a>
            ))}
          </div>
        </div>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      {videoData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoData) }}
        />
      )}
    </div>
  );
}
