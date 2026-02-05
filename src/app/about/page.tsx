import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "About Bhakti Sagar",
    description: "Learn about Bhakti Sagar and how the meaning feature works.",
    pathname: "/about"
  })
};

export default function AboutPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">About</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Why Bhakti Sagar?</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-sagar-ink/70">
        Bhakti Sagar is a calm, devotional space where you can find aartis and bhajans without distraction.
        Each prayer includes lyrics and an optional meaning panel, helping new and seasoned devotees alike
        connect with the words in simple language.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
          <h2 className="text-xl font-serif text-sagar-ink">Our intent</h2>
          <p className="mt-3 text-sm text-sagar-ink/70">
            Preserve the beauty of daily prayer while making it easier to understand. No noise, just devotion.
          </p>
        </div>
        <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
          <h2 className="text-xl font-serif text-sagar-ink">How meaning works</h2>
          <p className="mt-3 text-sm text-sagar-ink/70">
            Click the meaning panel on any aarti to receive a gentle summary or line-by-line explanation.
            We keep it respectful, easy, and focused on devotion.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
        <h2 className="text-xl font-serif text-sagar-ink">Image credits</h2>
        <p className="mt-3 text-sm text-sagar-ink/70">
          Category artwork is a mix of user-provided AI images and Wikimedia Commons (public domain / CC0).
        </p>
        <div className="mt-4 grid gap-2 text-sm text-sagar-ink/70 md:grid-cols-2">
          <p>Ganesha, Vishnu, Shiva, Hanuman, Krishna: user provided (AI-generated)</p>
          <a className="hover:text-sagar-saffron" href="https://commons.wikimedia.org/wiki/File:Unknown_(Indian)_-_Legend_of_Durga_-_73.296.48B_-_Detroit_Institute_of_Arts.jpg">Legend of Durga</a>
          <a className="hover:text-sagar-saffron" href="https://commons.wikimedia.org/wiki/File:Lakshmi_is_worshipped_by_Brahmins.jpg">Lakshmi is worshipped by Brahmins</a>
          <a className="hover:text-sagar-saffron" href="https://commons.wikimedia.org/wiki/File:Wargalsaraswati.jpg">Wargalsaraswati</a>
          <a className="hover:text-sagar-saffron" href="https://commons.wikimedia.org/wiki/File:1_Om.svg">Om symbol</a>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "About", url: "https://bhakti-sagar.com/about" }
        ])) }}
      />
    </div>
  );
}
