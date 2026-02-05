import { siteConfig } from "@/lib/seo";
import { getAartis } from "@/lib/data";

export function GET() {
  const items = getAartis().slice(0, 20);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${siteConfig.name}</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.description}</description>
    ${items
      .map((aarti) => {
        const title = aarti.title.english || aarti.title.hindi;
        const link = `${siteConfig.url}/aartis/${aarti.slug}`;
        return `<item>
          <title>${title}</title>
          <link>${link}</link>
          <guid>${link}</guid>
          <description>Lyrics and meaning for ${title}.</description>
        </item>`;
      })
      .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml" }
  });
}
