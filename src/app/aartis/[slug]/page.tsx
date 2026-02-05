import { notFound } from "next/navigation";
import AartiLyricsPanel from "@/components/AartiLyricsPanel";
import MeaningPanel from "@/components/MeaningPanel";
import ShareButton from "@/components/ShareButton";
import PrintButton from "@/components/PrintButton";
import { getAartiBySlug, getAartis, getAartisByCategory, getCategories } from "@/lib/data";
import { festivals } from "@/lib/content";
import { getYouTubeEmbedUrl, getYouTubeId } from "@/lib/youtube";
import type { Metadata } from "next";
import { buildMetadata, siteConfig } from "@/lib/seo";
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

  const category = getCategories().find((item) => item.slug === aarti.category);
  const embedUrl = getYouTubeEmbedUrl(aarti.youtubeUrl);
  const titleDisplay = aarti.title.english || aarti.title.hindi;
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

  return (
    <div className="container py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">
        <div className="flex flex-wrap items-center gap-3">
          <span>{category?.name ?? "Aarti"}</span>
          <span className="h-1 w-1 rounded-full bg-sagar-rose" />
          <span>{aarti.isTop ? "Top Aarti" : "Prayer"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          <ShareButton title={titleDisplay} />
        </div>
      </div>

      <h1 className="mt-4 text-4xl font-serif text-sagar-ink md:text-5xl">{titleDisplay}</h1>
      {aarti.title.hindi && aarti.title.english && (
        <p className="mt-2 text-lg text-sagar-ink/70">{aarti.title.hindi}</p>
      )}
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        Sing along with the lyrics and open the meaning panel for a gentle explanation.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-sagar-ink/60">
        <span>Last updated: Feb 5, 2026</span>
        <span>Reviewed by: {author?.name ?? "Bhakti Sagar"}</span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-card">
          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">On this page</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-sagar-ink/70">
              <a href="#lyrics" className="hover:text-sagar-saffron">Lyrics</a>
              <a href="#meaning" className="hover:text-sagar-saffron">AI summary</a>
              <a href="#how-to" className="hover:text-sagar-saffron">How to do aarti</a>
              <a href="#faq" className="hover:text-sagar-saffron">FAQ</a>
            </div>
          </div>
          <div id="lyrics" className="scroll-mt-24">
            <AartiLyricsPanel title={aarti.title} lyrics={aarti.lyrics} />
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
          <div id="faq" className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft scroll-mt-24">
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
          <div id="meaning" className="scroll-mt-24">
            <MeaningPanel title={titleDisplay} lyrics={aarti.lyrics.english.length ? aarti.lyrics.english : aarti.lyrics.hindi} />
          </div>
        </aside>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
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
      <div className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-soft">
        <h3 className="text-lg font-serif text-sagar-ink">About {category?.name ?? "the deity"}</h3>
        <p className="mt-3 text-sm text-sagar-ink/70">
          {category?.name ?? "This deity"} is honored in Hindu tradition with prayers, aartis, and devotional
          songs. Devotees sing these verses to offer gratitude, seek blessings, and cultivate devotion.
        </p>
      </div>
      {relatedFestivals.length > 0 && (
        <div className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-soft">
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
