import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import BhaktiGptPageView from "@/components/bhaktigpt/BhaktiGptPageView";
import Hero from "@/components/home/Hero";
import TrustStrip from "@/components/home/TrustStrip";
import WhyBhaktiGpt from "@/components/home/WhyBhaktiGpt";
import TransparencyNote from "@/components/home/TransparencyNote";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = headers().get("x-lang") === "hi" ? "hi" : "en";

  if (locale === "hi") {
    return buildMetadata({
      title: "भगवान से ऑनलाइन बात करें | भक्ति चैट",
      description:
        "श्री कृष्ण, लक्ष्मी जी और शनि देव से एआई के माध्यम से मार्गदर्शन पाएँ। अपने मन की बात कहें और सही दिशा पाएँ।",
      pathname: "/hi"
    });
  }

  return buildMetadata({
    title: "Bhakti Chat – The AI Hindu Devotion App",
    description:
      "Bhakti Chat helps you talk with AI guides inspired by Krishna, Lakshmi Ji, and Shani Dev for daily spiritual guidance and calm reflection.",
    pathname: "/en",
    keywords: [
      "Bhakti Chat",
      "Bhakti Chat AI",
      "Bhakti Chat guidance",
      "devotional AI",
      "spiritual guidance AI",
      "Krishna chat",
      "Lakshmi guidance",
      "Shani Dev guidance"
    ]
  });
}

export default async function HomePage() {
  const locale = headers().get("x-lang") === "hi" ? "hi" : "en";
  const localePrefix = `/${locale}`;
  const t = await getTranslations();
  return (
    <div className="container pb-14 pt-4 md:pt-6">
      <BhaktiGptPageView page="landing" />

      <Hero />
      <TrustStrip />
      <WhyBhaktiGpt />
      <TransparencyNote />

      <section className="mt-8 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/35 px-4 py-3 text-xs text-sagar-ink/70">
        <p className="flex flex-wrap items-center gap-2">
          <span>{t("home_more_tools")}</span>
          <Link href={`${localePrefix}/aartis`} className="font-semibold text-sagar-ember hover:text-sagar-saffron">
            {t("nav_aartis")}
          </Link>
          <span className="text-sagar-ink/45">·</span>
          <Link href={`${localePrefix}/choghadiya`} className="font-semibold text-sagar-ember hover:text-sagar-saffron">
            {t("nav_choghadiya")}
          </Link>
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/80 p-5">
        <h2 className="text-lg font-serif text-sagar-ink">
          {locale === "hi" ? "देवता ज्ञान हब" : "Deity knowledge hubs"}
        </h2>
        <p className="mt-2 text-sm text-sagar-ink/75">
          {locale === "hi"
            ? "गहन पढ़ाई और लंबी साधना के लिए इन हिंदी पेजों से शुरुआत करें।"
            : "Start here for deeper reading and long-form devotional guidance."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href={`${localePrefix}/krishna`} className="text-sagar-ember hover:text-sagar-saffron">
            {locale === "hi" ? "श्री कृष्ण हब" : "Shri Krishna hub"}
          </Link>
          <Link href={`${localePrefix}/lakshmi`} className="text-sagar-ember hover:text-sagar-saffron">
            {locale === "hi" ? "लक्ष्मी जी हब" : "Lakshmi Ji hub"}
          </Link>
          <Link href={`${localePrefix}/shani`} className="text-sagar-ember hover:text-sagar-saffron">
            {locale === "hi" ? "शनि देव हब" : "Shani Dev hub"}
          </Link>
        </div>
      </section>
    </div>
  );
}
