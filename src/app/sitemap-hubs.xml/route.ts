import { siteConfig, supportedLanguages } from "@/lib/seo";
import { deityHubs, festivals, poojaGuides, mantras, chalisas } from "@/lib/content";

function withLang(path: string) {
  return supportedLanguages.map((lang) => `${siteConfig.url}/${lang.code}${path}`);
}

export function GET() {
  const hubs = [
    "/",
    "/aartis",
    "/categories",
    "/deity",
    "/festival",
    "/pooja",
    "/pooja-vidhi",
    "/mantra",
    "/chalisa",
    "/stotras",
    "/vrat-katha",
    "/bhajan",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/editorial-policy",
    "/sources"
  ];

  const hubUrls = hubs.flatMap(withLang);
  const deityUrls = deityHubs.flatMap((item) => withLang(`/deity/${item.slug}`));
  const festivalUrls = festivals.flatMap((item) => withLang(`/festival/${item.slug}`));
  const poojaUrls = poojaGuides.flatMap((item) => withLang(`/pooja/${item.slug}`));
  const mantraUrls = mantras.flatMap((item) => withLang(`/mantra/${item.slug}`));
  const chalisaUrls = chalisas.flatMap((item) => withLang(`/chalisa/${item.slug}`));

  const urls = [...hubUrls, ...deityUrls, ...festivalUrls, ...poojaUrls, ...mantraUrls, ...chalisaUrls];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" }
  });
}
