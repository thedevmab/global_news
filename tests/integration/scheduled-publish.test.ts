import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient, Role, ArticleStatus } from "@prisma/client";
import { hashPassword } from "@/lib/security/password";
import { publishDueScheduledArticles } from "@/server/articles/scheduled-publish";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("scheduled publish concurrency", () => {
  const prisma = new PrismaClient();
  let authorId = "";
  let categoryId = "";
  const articleIds: string[] = [];

  beforeAll(async () => {
    const passwordHash = await hashPassword("TestPassword1");
    const author = await prisma.user.upsert({
      where: { emailNormalized: "cron-publisher@test.gvn" },
      update: {},
      create: {
        email: "cron-publisher@test.gvn",
        emailNormalized: "cron-publisher@test.gvn",
        name: "Cron Publisher",
        passwordHash,
        role: Role.PUBLISHER,
      },
    });
    const category = await prisma.category.findFirst({
      where: { slug: "politics" },
    });
    if (!category) throw new Error("Seed categories missing");
    authorId = author.id;
    categoryId = category.id;

    const past = new Date(Date.now() - 60_000);
    for (let i = 0; i < 3; i++) {
      const article = await prisma.article.create({
        data: {
          headline: `Scheduled concurrent ${i}`,
          slug: `scheduled-concurrent-${Date.now()}-${i}`,
          summary: "Concurrent cron publish idempotency check.",
          body: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Body" }],
              },
            ],
          },
          categoryId,
          authorId,
          status: ArticleStatus.SCHEDULED,
          scheduledAt: past,
          language: "en",
        },
      });
      articleIds.push(article.id);
    }
  });

  afterAll(async () => {
    if (articleIds.length) {
      await prisma.articleStateLog.deleteMany({
        where: { articleId: { in: articleIds } },
      });
      await prisma.auditLog.deleteMany({
        where: { entityId: { in: articleIds } },
      });
      await prisma.article.deleteMany({ where: { id: { in: articleIds } } });
    }
    await prisma.$disconnect();
  });

  it("two concurrent runs publish each article exactly once", async () => {
    const [a, b] = await Promise.all([
      publishDueScheduledArticles(25),
      publishDueScheduledArticles(25),
    ]);

    const publishedSet = new Set([...a.publishedIds, ...b.publishedIds]);
    for (const id of articleIds) {
      expect(publishedSet.has(id)).toBe(true);
    }

    // No duplicate IDs across both runs
    const allIds = [...a.publishedIds, ...b.publishedIds];
    expect(new Set(allIds).size).toBe(allIds.length);

    const rows = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, status: true, publishedAt: true, scheduledAt: true },
    });
    expect(rows).toHaveLength(articleIds.length);
    for (const row of rows) {
      expect(row.status).toBe(ArticleStatus.PUBLISHED);
      expect(row.publishedAt).toBeTruthy();
      expect(row.scheduledAt).toBeNull();
    }

    const logs = await prisma.articleStateLog.findMany({
      where: {
        articleId: { in: articleIds },
        fromStatus: ArticleStatus.SCHEDULED,
        toStatus: ArticleStatus.PUBLISHED,
      },
    });
    expect(logs).toHaveLength(articleIds.length);
  });
});
