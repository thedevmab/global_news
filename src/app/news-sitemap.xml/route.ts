import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";

export async function GET() {
  const base = getSiteUrl();
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { gte: since, lte: new Date() },
    },
    orderBy: { publishedAt: "desc" },
    take: 1000,
    include: { category: true },
  });

  const urls = articles
    .map(
      (a) => `
  <url>
    <loc>${base}/${a.category.slug}/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Global Voice Network</news:name>
        <news:language>${a.language}</news:language>
      </news:publication>
      <news:publication_date>${(a.publishedAt || a.createdAt).toISOString()}</news:publication_date>
      <news:title><![CDATA[${a.headline}]]></news:title>
    </news:news>
  </url>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300",
    },
  });
}
