import { ArticleStatus, type Article } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { invalidate, tags } from "@/server/cache";

type LockedArticle = Pick<Article, "id" | "status" | "authorId" | "scheduledAt">;

/**
 * Publish due SCHEDULED articles using row locks so concurrent cron runs are idempotent.
 */
export async function publishDueScheduledArticles(limit = 25): Promise<{
  publishedIds: string[];
  skipped: number;
}> {
  const now = new Date();
  let publishedIds: string[] = [];
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    const due = await tx.$queryRaw<LockedArticle[]>`
      SELECT id, status, "authorId", "scheduledAt"
      FROM "Article"
      WHERE status = CAST('SCHEDULED' AS "ArticleStatus")
        AND "scheduledAt" IS NOT NULL
        AND "scheduledAt" <= ${now}
        AND "deletedAt" IS NULL
      ORDER BY "scheduledAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    const eligible = due.filter((row) => row.status === ArticleStatus.SCHEDULED);
    skipped = due.length - eligible.length;
    if (eligible.length === 0) {
      publishedIds = [];
      return;
    }

    const ids = eligible.map((row) => row.id);

    await tx.article.updateMany({
      where: { id: { in: ids }, status: ArticleStatus.SCHEDULED },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: now,
        scheduledAt: null,
      },
    });

    await tx.articleStateLog.createMany({
      data: eligible.map((row) => ({
        articleId: row.id,
        fromStatus: ArticleStatus.SCHEDULED,
        toStatus: ArticleStatus.PUBLISHED,
        userId: row.authorId,
        reason: "cron_scheduled_publish",
      })),
    });

    await tx.auditLog.createMany({
      data: eligible.map((row) => ({
        actorId: null,
        action: "article.cron_publish",
        entityType: "Article",
        entityId: row.id,
        metadata: {
          from: ArticleStatus.SCHEDULED,
          to: ArticleStatus.PUBLISHED,
          scheduledAt: row.scheduledAt?.toISOString() ?? null,
        },
      })),
    });

    publishedIds = ids;
  });

  if (publishedIds.length) {
    logger.info("cron.publish_scheduled", {
      count: publishedIds.length,
      publishedIds,
    });
    invalidate(
      tags.articles,
      tags.homepage,
      tags.breaking,
      ...publishedIds.map((id) => tags.article(id)),
    );
  }

  return { publishedIds, skipped };
}
