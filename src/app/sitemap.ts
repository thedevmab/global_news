import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [articles, categories, pages, videos, podcasts] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        publishedAt: { lte: new Date() },
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        category: { select: { slug: true } },
      },
      take: 5000,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.staticPage.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.video.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.podcast.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    ...categories.map((c) => ({
      url: `${base}/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...articles.map((a) => ({
      url: `${base}/${a.category.slug}/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...pages.map((p) => ({
      url: `${base}/page/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...videos.map((v) => ({
      url: `${base}/videos/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...podcasts.map((p) => ({
      url: `${base}/podcasts/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
