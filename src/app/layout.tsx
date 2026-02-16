import "./globals.css";
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import PromoRibbon from "@/components/PromoRibbon";
import Footer from "@/components/Footer";
import { buildMetadata, getRequestLanguage, siteConfig } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/react";
import { organizationJsonLd, websiteJsonLd } from "@/lib/schema";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata({
    title: "A Global Devotional Platform",
    description: siteConfig.description,
    pathname: "/"
  }),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const lang = getRequestLanguage();
  const orgJsonLd = organizationJsonLd();
  const webJsonLd = websiteJsonLd();

  return (
    <html lang={lang}>
      <body className="font-sans">
        <div className="relative min-h-screen overflow-hidden">
          <PromoRibbon />
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
