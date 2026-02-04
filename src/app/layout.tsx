import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { siteConfig } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/react";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap"
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: siteConfig.ogImage }]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute -top-40 right-[-10%] h-80 w-80 rounded-full bg-sagar-gold/35 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-15%] left-[-10%] h-80 w-80 rounded-full bg-sagar-ember/25 blur-3xl" />
          <NavBar />
          <main className="pb-12">{children}</main>
          <Footer />
          <Analytics />
        </div>
      </body>
    </html>
  );
}
