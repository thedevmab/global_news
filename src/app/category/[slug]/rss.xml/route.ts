import { prisma } from "@/lib/db";
import { buildRssFeed, rssResponse } from "@/lib/seo/rss";
import { absoluteUrl } from "@/lib/utils";
import { notFound } from "next/navigation";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
  });
  if (!category) notFound();

  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      categoryId: category.id,
      language: "en",
    },
    include: {
      author: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const xml = buildRssFeed({
    title: `${category.nameEn} — Global Voice Network`,
    description: category.description || `Latest ${category.nameEn} news from GVN`,
    path: `/category/${category.slug}/rss.xml`,
    items: articles.map((a) => ({
      title: a.headline,
      link: absoluteUrl(`/article/${a.slug}`),
      description: a.summary,
      pubDate: a.publishedAt ?? a.createdAt,
      category: category.nameEn,
      author: a.author.name,
    })),
  });

  return rssResponse(xml);
}
