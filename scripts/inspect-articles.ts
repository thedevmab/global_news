import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      headline: true,
      status: true,
      language: true,
      publishedAt: true,
      deletedAt: true,
      hideFromHomepage: true,
      featuredMediaId: true,
      updatedAt: true,
    },
  });
  console.log(JSON.stringify(rows, null, 2));
  const counts = await prisma.article.groupBy({
    by: ["status"],
    where: {},
    _count: true,
  });
  console.log("counts", counts);
  const live = await prisma.article.count({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: new Date() },
      hideFromHomepage: false,
    },
  });
  console.log("liveHomepageEligible", live);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
