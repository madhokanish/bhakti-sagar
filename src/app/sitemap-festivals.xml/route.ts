import { siteConfig, supportedLanguages } from "@/lib/seo";
import { festivals } from "@/lib/content";

function withLang(path: string) {
  return supportedLanguages.map((lang) => `${siteConfig.url}/${lang.code}${path}`);
}

export function GET() {
  const urls = festivals.flatMap((festival) => withLang(`/festival/${festival.slug}`));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" }
  });
}
