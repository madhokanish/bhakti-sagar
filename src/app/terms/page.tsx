import type { Metadata } from "next";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export function generateMetadata(): Metadata {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  return buildMetadata({
    title: lang === "hi" ? "उपयोग की शर्तें" : "Terms of Use",
    description:
      lang === "hi"
        ? "भक्ति चैट के उपयोग की शर्तें और नियम पढ़ें।"
        : "Terms and conditions for using Bhakti Chat.",
    pathname: `${localePrefix}/terms`
  });
}

export default function TermsPage() {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  const copy =
    lang === "hi"
      ? {
          label: "शर्तें",
          title: "उपयोग की शर्तें",
          body: "भक्ति चैट की devotional सामग्री व्यक्तिगत और शैक्षणिक उपयोग के लिए है। कृपया पूरी सामग्री कॉपी करने की बजाय लिंक साझा करें। सुधार के लिए संपर्क करें:",
          home: "होम",
          page: "शर्तें"
        }
      : {
          label: "Terms",
          title: "Terms of Use",
          body: "Bhakti Chat provides devotional content for personal and educational use. Please share links rather than reproducing full pages. For corrections, contact",
          home: "Home",
          page: "Terms"
        };
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{copy.label}</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">{copy.title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        {copy.body} hello@bhaktichat.com.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: copy.home, url: `https://bhaktichat.com${localePrefix}` },
          { name: copy.page, url: `https://bhaktichat.com${localePrefix}/terms` }
        ])) }}
      />
    </div>
  );
}
