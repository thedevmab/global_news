import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  dbAvailable,
  disconnectTestPrisma,
  getTestPrisma,
} from "../helpers/db";
import {
  getPublishedArticleBySlug,
  isArticlePubliclyVisible,
} from "@/server/articles/public";
import { hashPassword } from "@/lib/security/password";

const run = await dbAvailable();

(run ? describe : describe.skip)("article publish visibility", () => {
  const prisma = getTestPrisma()!;
  const suffix = randomUUID().slice(0, 8);
  let authorId = "";
  let categoryId = "";
  let publishedSlug = "";
  let draftSlug = "";

  beforeAll(async () => {
    const category =
      (await prisma.category.findFirst({ where: { isActive: true } })) ||
      (await prisma.category.create({
        data: {
          nameEn: `Test Cat ${suffix}`,
          slug: `test-cat-${suffix}`,
        },
      }));
    categoryId = category.id;

    const email = `author-${suffix}@example.com`;
    const author = await prisma.user.create({
      data: {
        email,
        emailNormalized: email,
        name: "Author",
        passwordHash: await hashPassword("ValidPassw0rd"),
        role: "PUBLISHER",
      },
    });
    authorId = author.id;

    publishedSlug = `published-${suffix}`;
    draftSlug = `draft-${suffix}`;

    await prisma.article.create({
      data: {
        headline: "Published piece",
        slug: publishedSlug,
        summary: "A published summary for visibility tests.",
        body: { type: "doc", content: [] },
        status: "PUBLISHED",
        publishedAt: new Date(),
        categoryId,
        authorId,
      },
    });

    await prisma.article.create({
      data: {
        headline: "Draft piece",
        slug: draftSlug,
        summary: "A draft summary that must stay private.",
        body: { type: "doc", content: [] },
        status: "DRAFT",
        categoryId,
        authorId,
      },
    });
  });

  afterAll(async () => {
    await prisma.article.deleteMany({
      where: { slug: { in: [publishedSlug, draftSlug] } },
    });
    await prisma.user.deleteMany({ where: { id: authorId } });
    await disconnectTestPrisma();
  });

  it("exposes only published articles via public query", async () => {
    const published = await getPublishedArticleBySlug(publishedSlug);
    const draft = await getPublishedArticleBySlug(draftSlug);
    expect(published).not.toBeNull();
    expect(published?.headline).toBe("Published piece");
    expect(draft).toBeNull();
  });

  it("isArticlePubliclyVisible matches status rules", async () => {
    const rows = await prisma.article.findMany({
      where: { slug: { in: [publishedSlug, draftSlug] } },
    });
    const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]));
    expect(isArticlePubliclyVisible(bySlug[publishedSlug])).toBe(true);
    expect(isArticlePubliclyVisible(bySlug[draftSlug])).toBe(false);
  });
});
