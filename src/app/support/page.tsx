import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export function generateMetadata(): Metadata {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  return buildMetadata({
    title: lang === "hi" ? "सहायता" : "Support",
    description:
      lang === "hi"
        ? "भक्ति चैट सहायता: खाते, चैट, भुगतान और तकनीकी सहायता के लिए संपर्क करें।"
        : "Bhakti Chat support for account, chat, billing, and technical help.",
    pathname: `${localePrefix}/support`
  });
}

export default function SupportPage() {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  const isHindi = lang === "hi";

  const copy = isHindi
    ? {
        label: "सहायता",
        title: "भक्ति चैट सहायता",
        intro:
          "खाता, चैट, भुगतान या तकनीकी समस्या में हम मदद के लिए उपलब्ध हैं। तेज सहायता के लिए हमें support@bhaktichat.com पर लिखें।",
        hoursTitle: "सहायता समय",
        hoursText: "सोमवार से शनिवार, सुबह 9:00 बजे से शाम 6:00 बजे (IST)। सामान्यतः 24 से 48 घंटे में जवाब मिलता है।",
        includeTitle: "मेल में क्या लिखें",
        includeText: "कृपया अपना अकाउंट ईमेल, डिवाइस का नाम, और समस्या का छोटा विवरण लिखें ताकि हम जल्दी मदद कर सकें।",
        billingTitle: "बिलिंग सहायता",
        billingText: "सब्सक्रिप्शन या भुगतान से जुड़ी सहायता के लिए विषय में “Billing Support” लिखकर मेल करें।",
        privacyTitle: "गोपनीयता सहायता",
        privacyText: "डेटा या प्राइवेसी से जुड़ी जानकारी के लिए हमारी Privacy Policy देखें और सहायता टीम से संपर्क करें।",
        home: "होम",
        page: "सहायता"
      }
    : {
        label: "Support",
        title: "Bhakti Chat Support",
        intro:
          "We are here to help with account access, chat issues, billing questions, and technical support. For faster help, write to support@bhaktichat.com.",
        hoursTitle: "Support hours",
        hoursText: "Monday to Saturday, 9:00 AM to 6:00 PM IST. We usually respond within 24 to 48 hours.",
        includeTitle: "What to include in your email",
        includeText: "Share your account email, device name, and a short issue summary so we can help quickly.",
        billingTitle: "Billing support",
        billingText: "For subscription, payment, or invoice help, email us with the subject line “Billing Support”.",
        privacyTitle: "Privacy support",
        privacyText: "For privacy and data requests, review our Privacy Policy and contact support.",
        home: "Home",
        page: "Support"
      };

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{copy.label}</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">{copy.title}</h1>
      <p className="mt-3 max-w-3xl text-sm text-sagar-ink/70">{copy.intro}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <h2 className="text-base font-semibold text-sagar-ink">{copy.hoursTitle}</h2>
          <p className="mt-2 text-sm text-sagar-ink/75">{copy.hoursText}</p>
        </section>

        <section className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <h2 className="text-base font-semibold text-sagar-ink">{copy.includeTitle}</h2>
          <p className="mt-2 text-sm text-sagar-ink/75">{copy.includeText}</p>
        </section>

        <section className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <h2 className="text-base font-semibold text-sagar-ink">{copy.billingTitle}</h2>
          <p className="mt-2 text-sm text-sagar-ink/75">{copy.billingText}</p>
        </section>

        <section className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <h2 className="text-base font-semibold text-sagar-ink">{copy.privacyTitle}</h2>
          <p className="mt-2 text-sm text-sagar-ink/75">
            {copy.privacyText}{" "}
            <Link href={`${localePrefix}/privacy`} className="font-semibold text-sagar-ink underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: copy.home, url: `https://bhaktichat.com${localePrefix}` },
              { name: copy.page, url: `https://bhaktichat.com${localePrefix}/support` }
            ])
          )
        }}
      />
    </div>
  );
}
