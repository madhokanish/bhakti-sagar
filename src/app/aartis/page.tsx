import AartiCard from "@/components/AartiCard";
import { getAartis, searchAartis } from "@/lib/data";
import type { Metadata } from "next";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";

function getAartiPageCopy(lang: "en" | "hi") {
  if (lang === "hi") {
    return {
      title: "सभी आरती और भजन",
      sectionLabel: "आरती संग्रह",
      searchResultTitle: "खोज परिणाम",
      description: "हिंदी और अंग्रेज़ी में आरती और भजन पढ़ें, समझें और सुनें।",
      queryDescription: "भक्ति चैट पर आपकी खोज के परिणाम देखें।",
      resultsLabel: (query: string, count: number) => `“${query}” के लिए परिणाम (${count})`,
      totalLabel: (count: number) => `${count} प्रार्थनाएँ उपलब्ध`,
      placeholder: "शीर्षक, देवता या टैग से खोजें",
      searchCta: "खोजें",
      faq: [
        {
          q: "क्या यहाँ आरती हिंदी में उपलब्ध है?",
          a: "हाँ, भक्ति चैट पर हिंदी पाठ और अंग्रेज़ी लिप्यंतरण दोनों उपलब्ध हैं।"
        },
        {
          q: "क्या आरती का अर्थ भी मिलता है?",
          a: "हाँ। AI Insight पैनल में सरल अर्थ पढ़ सकते हैं।"
        },
        {
          q: "क्या मैं देवता के नाम से खोज सकता हूँ?",
          a: "हाँ, देवता के नाम से खोजें या श्रेणियों से ब्राउज़ करें।"
        },
        {
          q: "क्या वीडियो भी उपलब्ध हैं?",
          a: "कई आरती पेज पर YouTube वीडियो भी जुड़े होते हैं।"
        },
        {
          q: "क्या यह सामग्री मुफ्त है?",
          a: "हाँ, सभी आरती और अर्थ पढ़ने के लिए मुफ्त हैं।"
        }
      ],
      breadcrumbs: [
        { name: "होम", url: "https://bhaktichat.com/hi" },
        { name: "आरती", url: "https://bhaktichat.com/hi/aartis" }
      ]
    };
  }

  return {
    title: "All Aartis & Bhajans",
    sectionLabel: "Aarti Library",
    searchResultTitle: "Search results",
    description: "Browse the full library of aartis and bhajans with English and Hindi lyrics.",
    queryDescription: "Search results on Bhakti Chat.",
    resultsLabel: (query: string, count: number) => `Results for “${query}” (${count})`,
    totalLabel: (count: number) => `${count} prayers available`,
    placeholder: "Search by title, deity, tag",
    searchCta: "Search",
    faq: [
      {
        q: "Where can I find aarti lyrics in English?",
        a: "Bhakti Chat provides aarti lyrics in English letters along with Hindi text."
      },
      {
        q: "Do you have aarti meaning?",
        a: "Yes. Use the AI Insight panel to read a short, simple meaning."
      },
      {
        q: "Can I search by deity?",
        a: "Yes. Search by deity name or browse categories."
      },
      {
        q: "Are videos available?",
        a: "Many aarti pages include embedded YouTube videos."
      },
      {
        q: "Is this content free?",
        a: "Yes, all aarti lyrics and meanings are free to read."
      }
    ],
    breadcrumbs: [
      { name: "Home", url: "https://bhaktichat.com/en" },
      { name: "Aartis", url: "https://bhaktichat.com/en/aartis" }
    ]
  };
}

export function generateMetadata({
  searchParams
}: {
  searchParams?: { q?: string };
}): Metadata {
  const lang = getRequestLanguage();
  const copy = getAartiPageCopy(lang);
  const query = searchParams?.q?.trim();
  const title = query ? `${copy.searchResultTitle} "${query}"` : copy.title;
  const description = query
    ? `${copy.queryDescription} ${query}.`
    : copy.description;
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  return buildMetadata({
    title,
    description,
    pathname: `${localePrefix}/aartis`,
    noindex: Boolean(query)
  });
}

export default function AartisPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  const query = searchParams?.q ?? "";
  const results = query ? searchAartis(query) : getAartis();
  const lang = getRequestLanguage();
  const copy = getAartiPageCopy(lang);
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  const breadcrumbData = breadcrumbJsonLd(copy.breadcrumbs);
  const faqData = faqJsonLd(copy.faq);

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{copy.sectionLabel}</p>
          <h1 className="mt-2 text-3xl font-serif text-sagar-ink">{copy.title}</h1>
          <p className="mt-2 text-sm text-sagar-ink/70">
            {query ? copy.resultsLabel(query, results.length) : copy.totalLabel(results.length)}
          </p>
        </div>
        <form action={`${localePrefix}/aartis`} className="flex w-full max-w-md items-center gap-2 rounded-full border border-sagar-amber/30 bg-white px-4 py-2 shadow-sagar-soft">
          <input
            name="q"
            defaultValue={query}
            placeholder={copy.placeholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-sagar-ink/50"
          />
          <button className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            {copy.searchCta}
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {results.map((aarti) => (
          <AartiCard key={aarti.id} aarti={aarti} language={lang} />
        ))}
      </div>
      {!query && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </div>
  );
}
