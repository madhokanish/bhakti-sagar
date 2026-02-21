import type { Metadata } from "next";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export function generateMetadata(): Metadata {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  return buildMetadata({
    title: lang === "hi" ? "प्राइवेसी पॉलिसी" : "Privacy Policy",
    description:
      lang === "hi"
        ? "जानें कि भक्ति चैट डेटा और गोपनीयता को कैसे संभालता है।"
        : "Read how Bhakti Chat handles data and privacy.",
    pathname: `${localePrefix}/privacy`
  });
}

export default function PrivacyPage() {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  const copy =
    lang === "hi"
      ? {
          label: "प्राइवेसी",
          title: "प्राइवेसी पॉलिसी",
          body: "हम अनुभव बेहतर बनाने के लिए बुनियादी आँकड़ों का उपयोग करते हैं। हम आपका व्यक्तिगत डेटा नहीं बेचते। सवालों के लिए हमें लिखें:",
          home: "होम",
          page: "प्राइवेसी"
        }
      : {
          label: "Privacy",
          title: "Privacy Policy",
          body: "We collect basic analytics to improve the experience. We do not sell personal data. If you have questions, please reach out at",
          home: "Home",
          page: "Privacy"
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
          { name: copy.page, url: `https://bhaktichat.com${localePrefix}/privacy` }
        ])) }}
      />
    </div>
  );
}
