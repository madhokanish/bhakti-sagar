import { siteConfig } from "@/lib/seo";
import { deityHubs, festivals, poojaGuides, mantras, chalisas } from "@/lib/content";
import { cities } from "@/lib/choghadiyaCities";

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
    "/choghadiya",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/editorial-policy",
    "/sources"
  ];

  const hubUrls = hubs.map((path) => `${siteConfig.url}${path}`);
  const deityUrls = deityHubs.map((item) => `${siteConfig.url}/deity/${item.slug}`);
  const festivalUrls = festivals.map((item) => `${siteConfig.url}/festival/${item.slug}`);
  const poojaUrls = poojaGuides.map((item) => `${siteConfig.url}/pooja/${item.slug}`);
  const mantraUrls = mantras.map((item) => `${siteConfig.url}/mantra/${item.slug}`);
  const chalisaUrls = chalisas.map((item) => `${siteConfig.url}/chalisa/${item.slug}`);
  const choghadiyaUrls = cities.map((city) => `${siteConfig.url}/choghadiya/${city.slug}`);

  const urls = [
    ...hubUrls,
    ...deityUrls,
    ...festivalUrls,
    ...poojaUrls,
    ...mantraUrls,
    ...chalisaUrls,
    ...choghadiyaUrls
  ];
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
