import "./globals.css";
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import AuthModalProvider from "@/components/auth/AuthModalProvider";
import { buildMetadata, siteConfig } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { organizationJsonLd, websiteJsonLd } from "@/lib/schema";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata({
    title: "Bhakti Chat",
    description: siteConfig.description,
    pathname: "/"
  }),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/bhakti-chat-logo.png", sizes: "500x500", type: "image/png" }
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
  const locale = "en";
  const messages = require("../messages/en.json");
  const orgJsonLd = organizationJsonLd();
  const webJsonLd = websiteJsonLd("en");

  return (
    <html lang="en">
      <body className="font-sans">
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
                <SpeedInsights />
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
