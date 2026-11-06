import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.homepageSlot.deleteMany();
  const r = await prisma.article.updateMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    data: { deletedAt: new Date(), status: "TRASH" },
  });
  console.log(`Cleared homepage slots; trashed ${r.count} published articles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
