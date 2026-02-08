import { siteConfig } from "@/lib/seo";
import { getAartis } from "@/lib/data";

export function GET() {
  const aartis = getAartis();
  const urls = aartis.map((aarti) => `${siteConfig.url}/aartis/${aarti.slug}`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" }
  });
}
