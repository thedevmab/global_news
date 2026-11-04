import { describe, expect, it, beforeAll } from "vitest";
import { PrismaClient, Role, ArticleStatus } from "@prisma/client";
import { hashPassword } from "@/lib/security/password";
import { transitionArticleStatus } from "@/server/articles/workflow";
import { canPerformTransition } from "@/lib/rbac";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("article workflow integration", () => {
  const prisma = new PrismaClient();
  let contributorId = "";
  let publisherId = "";
  let categoryId = "";
  let articleId = "";

  beforeAll(async () => {
    const passwordHash = await hashPassword("TestPassword1");
    const contributor = await prisma.user.upsert({
      where: { emailNormalized: "contributor@test.gvn" },
      update: {},
      create: {
        email: "contributor@test.gvn",
        emailNormalized: "contributor@test.gvn",
        name: "Contributor",
        passwordHash,
        role: Role.CONTRIBUTOR,
      },
    });
    const publisher = await prisma.user.upsert({
      where: { emailNormalized: "publisher@test.gvn" },
      update: {},
      create: {
        email: "publisher@test.gvn",
        emailNormalized: "publisher@test.gvn",
        name: "Publisher",
        passwordHash,
        role: Role.PUBLISHER,
      },
    });
    const category = await prisma.category.findFirst({
      where: { slug: "politics" },
    });
    if (!category) throw new Error("Seed categories missing");
    contributorId = contributor.id;
    publisherId = publisher.id;
    categoryId = category.id;

    const article = await prisma.article.create({
      data: {
        headline: "Integration workflow story",
        slug: `integration-workflow-${Date.now()}`,
        summary: "Testing editorial workflow transitions end to end.",
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
        authorId: contributorId,
        status: ArticleStatus.DRAFT,
        language: "en",
      },
    });
    articleId = article.id;
  });

  it("contributor cannot publish", () => {
    expect(
      canPerformTransition(
        {
          id: contributorId,
          email: "c",
          name: "c",
          role: "CONTRIBUTOR",
          status: "ACTIVE",
        },
        "APPROVED",
        "PUBLISHED",
        contributorId,
      ),
    ).toBe(false);
  });

  it("runs draft → review → approve → publish", async () => {
    const contributor = {
      id: contributorId,
      email: "contributor@test.gvn",
      name: "Contributor",
      role: "CONTRIBUTOR" as const,
      status: "ACTIVE" as const,
    };
    const publisher = {
      id: publisherId,
      email: "publisher@test.gvn",
      name: "Publisher",
      role: "PUBLISHER" as const,
      status: "ACTIVE" as const,
    };

    await prisma.$transaction(async (tx) => {
      const a = await tx.article.findUniqueOrThrow({ where: { id: articleId } });
      await transitionArticleStatus(tx, {
        article: a,
        to: ArticleStatus.IN_REVIEW,
        user: contributor,
      });
    });

    await prisma.$transaction(async (tx) => {
      const a = await tx.article.findUniqueOrThrow({ where: { id: articleId } });
      await transitionArticleStatus(tx, {
        article: a,
        to: ArticleStatus.APPROVED,
        user: publisher,
      });
    });

    await prisma.$transaction(async (tx) => {
      const a = await tx.article.findUniqueOrThrow({ where: { id: articleId } });
      await transitionArticleStatus(tx, {
        article: a,
        to: ArticleStatus.PUBLISHED,
        user: publisher,
      });
    });

    const published = await prisma.article.findUniqueOrThrow({
      where: { id: articleId },
    });
    expect(published.status).toBe(ArticleStatus.PUBLISHED);
    expect(published.publishedAt).toBeTruthy();
  });
});
