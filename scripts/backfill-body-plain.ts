import { PrismaClient } from "@prisma/client";
import { extractTipTapText } from "../src/lib/tiptap-text";

const prisma = new PrismaClient();

async function main() {
  const batchSize = 100;
  let cursor: string | undefined;
  let updated = 0;

  for (;;) {
    const rows = await prisma.article.findMany({
      take: batchSize,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : {}),
      orderBy: { id: "asc" },
      select: { id: true, body: true },
    });
    if (rows.length === 0) break;

    for (const row of rows) {
      const text = extractTipTapText(row.body);
      await prisma.article.update({
        where: { id: row.id },
        data: { bodyPlain: text },
      });
      updated += 1;
    }

    cursor = rows[rows.length - 1]?.id;
    if (rows.length < batchSize) break;
  }

  console.log(`Backfilled bodyPlain on ${updated} articles`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
