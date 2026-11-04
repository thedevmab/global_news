import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";

export async function GET() {
  const base = getSiteUrl();
  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: new Date() },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: { category: true },
  });

  const items = articles
    .map(
      (a) => `
    <item>
      <title><![CDATA[${a.headline}]]></title>
      <link>${base}/${a.category.slug}/${a.slug}</link>
      <guid isPermaLink="true">${base}/${a.category.slug}/${a.slug}</guid>
      <description><![CDATA[${a.summary}]]></description>
      <pubDate>${(a.publishedAt || a.createdAt).toUTCString()}</pubDate>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Global Voice Network</title>
    <link>${base}</link>
    <description>Latest news from Global Voice Network</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600",
    },
  });
}
