import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
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
import { Cormorant_Garamond, Manrope, Noto_Sans_Devanagari } from "next/font/google";
import GoogleAnalyticsPageTracker from "@/components/GoogleAnalyticsPageTracker";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display"
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-9H0MCC74YW";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata({
    title: "Bhakti Chat",
    description: siteConfig.description,
    pathname: "/"
  }),
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/bhakti-chat-logo.png", sizes: "500x500", type: "image/png" }
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const requestPathname = headers().get("x-pathname") ?? "";
  const requestLang = requestPathname === "/hi" || requestPathname.startsWith("/hi/") ? "hi" : "en";
  const locale = requestLang;
  const messages =
    locale === "hi"
      ? (await import("../messages/hi.json")).default
      : (await import("../messages/en.json")).default;
  const orgJsonLd = organizationJsonLd();
  const webJsonLd = websiteJsonLd(locale);

  return (
    <html lang={locale === "hi" ? "hi" : "en"}>
      <body
        className={`${manrope.variable} ${cormorant.variable} ${locale === "hi" ? notoSansDevanagari.className : ""} font-sans antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthSessionProvider>
            <AuthModalProvider>
              <div className="app-shell relative min-h-screen overflow-hidden">
                <NavBar />
                <main className="pb-12">{children}</main>
                <Footer />
                <GoogleAnalyticsPageTracker measurementId={GA_MEASUREMENT_ID} />
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
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="0ce4deed-b126-425c-81fe-4bdbc49013fd"
          data-blockingmode="auto"
          type="text/javascript"
          strategy="beforeInteractive"
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          `}
        </Script>
      </body>
    </html>
  );
}
