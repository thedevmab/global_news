import { ArticleStatus, type Article } from "@prisma/client";
import { prisma, type TxClient } from "@/lib/db";
import { logger } from "@/lib/logger";

type LockedArticle = Pick<Article, "id" | "status" | "authorId" | "scheduledAt">;

/**
 * Publish due SCHEDULED articles using row locks so concurrent cron runs are idempotent.
 */
export async function publishDueScheduledArticles(limit = 25): Promise<{
  publishedIds: string[];
  skipped: number;
}> {
  const now = new Date();
  const publishedIds: string[] = [];
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

    for (const row of due) {
      // Re-check inside the lock — another worker may have flipped status
      if (row.status !== ArticleStatus.SCHEDULED) {
        skipped += 1;
        continue;
      }

      await publishLockedScheduled(tx, row, now);
      publishedIds.push(row.id);
    }
  });

  if (publishedIds.length) {
    logger.info("cron.publish_scheduled", { count: publishedIds.length, publishedIds });
  }

  return { publishedIds, skipped };
}

async function publishLockedScheduled(
  tx: TxClient,
  article: LockedArticle,
  now: Date,
) {
  await tx.article.update({
    where: { id: article.id },
    data: {
      status: ArticleStatus.PUBLISHED,
      publishedAt: now,
      scheduledAt: null,
    },
  });

  await tx.articleStateLog.create({
    data: {
      articleId: article.id,
      fromStatus: ArticleStatus.SCHEDULED,
      toStatus: ArticleStatus.PUBLISHED,
      userId: article.authorId,
      reason: "cron_scheduled_publish",
    },
  });

  await tx.auditLog.create({
    data: {
      actorId: null,
      action: "article.cron_publish",
      entityType: "Article",
      entityId: article.id,
      metadata: {
        from: ArticleStatus.SCHEDULED,
        to: ArticleStatus.PUBLISHED,
        scheduledAt: article.scheduledAt?.toISOString() ?? null,
      },
    },
  });
}
