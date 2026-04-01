import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HomePageContent from "@/components/home/HomePageContent";
import { HOME_LANG_COOKIE, isHomeLang, resolveHomeLang, type HomeLang } from "@/lib/homeCopy";
import { buildUrl } from "@/lib/site";

const HOME_TITLE = "BhaktiChat – The AI Hindu Devotion App";
const HOME_DESCRIPTION =
  "Talk to Shri Krishna, seek blessings from Lakshmi Ji, and receive guidance from Shani Dev. A private AI powered Hindu devotion app for daily reflection, clarity, and faith. Free to start.";

function resolveHomeLangFromQuery(raw: string | undefined): HomeLang | null {
  return isHomeLang(raw) ? raw : null;
}

export async function generateMetadata({
  searchParams
}: {
  searchParams?: { lang?: string };
}): Promise<Metadata> {
  const cookieStore = cookies();
  const queryLang = resolveHomeLangFromQuery(searchParams?.lang);
  const cookieLang = resolveHomeLang(cookieStore.get(HOME_LANG_COOKIE)?.value, "en");
  const effectiveLang = queryLang ?? cookieLang;
  const noindex = effectiveLang === "hinglish";
  const ogImage = buildUrl("en", "/og/bhaktichat.png");

  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    alternates: {
      canonical: buildUrl("en"),
      languages: {
        en: buildUrl("en"),
        hi: buildUrl("hi"),
        "hi-IN": buildUrl("hi"),
        "x-default": buildUrl("en")
      }
    },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      type: "website",
      siteName: "BhaktiChat",
      url: buildUrl("en"),
      images: [{ url: ogImage, width: 1200, height: 630, alt: "BhaktiChat" }]
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: [ogImage]
    }
  };
}

export default function HomePage({
  searchParams
}: {
  searchParams?: { lang?: string };
}) {
  const cookieStore = cookies();
  const queryLang = resolveHomeLangFromQuery(searchParams?.lang);
  const cookieLang = resolveHomeLang(cookieStore.get(HOME_LANG_COOKIE)?.value, "en");
  const selectedLang = queryLang ?? cookieLang;

  if (selectedLang === "hi") {
    redirect("/hi");
  }

  const lang = selectedLang === "hinglish" ? "hinglish" : "en";
  return <HomePageContent lang={lang} />;
}
