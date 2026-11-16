import { prisma } from "@/lib/db";
import { cachedQuery, tags } from "@/server/cache";

export const getSearchAuthors = cachedQuery(
  async () => {
    return prisma.authorProfile.findMany({
      where: {
        isPublic: true,
        articles: {
          some: {
            status: "PUBLISHED",
            deletedAt: null,
            publishedAt: { lte: new Date() },
          },
        },
      },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        username: true,
      },
    });
  },
  ["getSearchAuthors"],
  { tags: [tags.articles, tags.authors], revalidate: 300 },
);
