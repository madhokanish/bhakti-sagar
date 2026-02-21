import type { Metadata } from "next";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export function generateMetadata(): Metadata {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  return buildMetadata({
    title: lang === "hi" ? "संपर्क" : "Contact",
    description: lang === "hi" ? "भक्ति चैट टीम से संपर्क करें।" : "Get in touch with the Bhakti Chat team.",
    pathname: `${localePrefix}/contact`
  });
}

export default function ContactPage() {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  const copy =
    lang === "hi"
      ? {
          label: "संपर्क",
          title: "भक्ति चैट से संपर्क करें",
          body: "सुधार, सुझाव या साझेदारी के लिए हमें ईमेल करें:",
          home: "होम",
          page: "संपर्क"
        }
      : {
          label: "Contact",
          title: "Contact Bhakti Chat",
          body: "For corrections, feedback, or partnership inquiries, email us at",
          home: "Home",
          page: "Contact"
        };
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{copy.label}</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">{copy.title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        {copy.body}
        <span className="font-semibold text-sagar-ink"> hello@bhaktichat.com</span>.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: copy.home, url: `https://bhaktichat.com${localePrefix}` },
          { name: copy.page, url: `https://bhaktichat.com${localePrefix}/contact` }
        ])) }}
      />
    </div>
  );
}
