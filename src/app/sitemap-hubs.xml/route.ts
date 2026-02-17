import { siteConfig } from "@/lib/seo";
import { deityHubs, festivals, poojaGuides, mantras, chalisas } from "@/lib/content";
import { cities } from "@/lib/choghadiyaCities";
import { getActiveOnlinePujas } from "@/lib/onlinePuja";
import { getLiveMandirs } from "@/data/liveMandirs";
import { resolveLiveMandirs } from "@/lib/liveDarshan";

export async function GET() {
  const hubs = [
    "/",
    "/aartis",
    "/categories",
    "/deity",
    "/festival",
    "/pooja",
    "/pooja-vidhi",
    "/panchang",
    "/mantra",
    "/chalisa",
    "/stotras",
    "/vrat-katha",
    "/bhajan",
    "/choghadiya",
    "/live",
    "/online-puja",
    "/online-puja/ganesh-weekly",
    "/online-puja/shani-weekly",
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
  const onlinePujaUrls = getActiveOnlinePujas().map((puja) => `${siteConfig.url}/online-puja/${puja.slug}`);
  const resolvedLiveMandirs = await resolveLiveMandirs(getLiveMandirs());
  const liveDarshanUrls = resolvedLiveMandirs.map((mandir) => `${siteConfig.url}/live/${mandir.slug}`);

  const urls = [
    ...hubUrls,
    ...deityUrls,
    ...festivalUrls,
    ...poojaUrls,
    ...mantraUrls,
    ...chalisaUrls,
    ...choghadiyaUrls,
    ...onlinePujaUrls,
    ...liveDarshanUrls
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
