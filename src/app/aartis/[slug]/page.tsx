import { notFound } from "next/navigation";
import AartiLyricsPanel from "@/components/AartiLyricsPanel";
import MeaningPanel from "@/components/MeaningPanel";
import ShareButton from "@/components/ShareButton";
import { getAartiBySlug, getAartis, getCategories } from "@/lib/data";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";

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
    title: toTitle(title),
    description: toDescription(description),
    alternates: {
      canonical: `/aartis/${aarti.slug}`
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: titleDisplay,
    description: `Lyrics and meaning for ${titleDisplay}.`,
    inLanguage: ["en", "hi"],
    url: `/aartis/${aarti.slug}`
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

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="rounded-3xl border border-sagar-amber/20 bg-white/80 p-6 shadow-sagar-card">
          <AartiLyricsPanel title={aarti.title} lyrics={aarti.lyrics} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24">
          <MeaningPanel title={aarti.title.english || aarti.title.hindi} lyrics={aarti.lyrics.english.length ? aarti.lyrics.english : aarti.lyrics.hindi} />
          <div className="rounded-3xl border border-sagar-amber/20 bg-white/80 p-4 shadow-sagar-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Video</p>
            <h2 className="mt-2 text-lg font-serif text-sagar-ink">Listen & sing along</h2>
            <div className="mt-4">
              {embedUrl ? (
                <div className="aspect-video overflow-hidden rounded-2xl bg-sagar-cream/70">
                  <iframe
                    src={embedUrl}
                    title={titleDisplay}
                    className="h-full w-full"
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
        </aside>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
