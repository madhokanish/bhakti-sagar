import "./globals.css";
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import AuthModalProvider from "@/components/auth/AuthModalProvider";
import { buildMetadata, getRequestLanguage, siteConfig } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/react";
import { organizationJsonLd, websiteJsonLd } from "@/lib/schema";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";
import { Noto_Sans_Devanagari } from "next/font/google";

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata({
    title: "Bhakti Chat",
    description: siteConfig.description,
    pathname: "/"
  }),
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/bhakti-chat-logo.png", sizes: "786x786", type: "image/png" }
    ],
    shortcut: [{ url: "/favicon-32.png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const lang = getRequestLanguage();
  const locale = headers().get("x-lang") === "hi" ? "hi" : "en";
  const messages = locale === "hi" ? require("../messages/hi.json") : require("../messages/en.json");
  const orgJsonLd = organizationJsonLd();
  const webJsonLd = websiteJsonLd(locale);

  return (
    <html lang={lang}>
      <body
        className={`font-sans ${locale === "hi" ? `${notoSansDevanagari.className} text-[1.05rem] leading-[1.75]` : ""}`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthSessionProvider>
            <AuthModalProvider>
              <div className="relative min-h-screen overflow-hidden">
                <NavBar />
                <main className="pb-12">{children}</main>
                <Footer />
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
                />
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(webJsonLd) }}
                />
                <Analytics />
              </div>
            </AuthModalProvider>
          </AuthSessionProvider>
        </NextIntlClientProvider>
        <Script id="consent-default" strategy="beforeInteractive" data-cookieconsent="ignore">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag("consent", "default", {
              ad_personalization: "denied",
              ad_storage: "denied",
              ad_user_data: "denied",
              analytics_storage: "denied",
              functionality_storage: "denied",
              personalization_storage: "denied",
              security_storage: "granted",
              wait_for_update: 500
            });
            gtag("set", "ads_data_redaction", true);
            gtag("set", "url_passthrough", false);
          `}
        </Script>
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="0ce4deed-b126-425c-81fe-4bdbc49013fd"
          data-blockingmode="auto"
          type="text/javascript"
          strategy="beforeInteractive"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9H0MCC74YW"
          strategy="afterInteractive"
          data-cookieconsent="statistics"
        />
        <Script id="ga4-init" strategy="afterInteractive" data-cookieconsent="statistics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9H0MCC74YW');
          `}
        </Script>
      </body>
    </html>
  );
}
