import "./globals.css";
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { buildMetadata, getRequestLanguage, siteConfig } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/react";
import { organizationJsonLd, websiteJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata({
    title: "Aarti Lyrics, Pooja Vidhi, Mantra and Meaning",
    description: siteConfig.description,
    pathname: "/"
  }),
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
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
      </body>
    </html>
  );
}
