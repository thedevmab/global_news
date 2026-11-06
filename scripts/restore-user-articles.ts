import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Restore articles trashed by the sample cleanup that look like real staff posts. */
async function main() {
  // Restore the staff Amharic post (and any other non-seed posts published today)
  const restored = await prisma.article.updateMany({
    where: {
      status: "TRASH",
      deletedAt: { not: null },
      OR: [
        { language: "am" },
        {
          publishedAt: {
            gte: new Date("2026-11-06T00:00:00.000Z"),
          },
        },
      ],
    },
    data: {
      status: "PUBLISHED",
      deletedAt: null,
    },
  });
  console.log("restored", restored.count);

  const live = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
    },
    select: {
      id: true,
      headline: true,
      language: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });
  console.log(JSON.stringify(live, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
