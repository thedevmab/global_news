import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { timingSafeEqualString } from "@/lib/security/tokens";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || !token || !timingSafeEqualString(secret, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Keep FOR UPDATE SKIP LOCKED inside the transaction so locks are held.
  const published = await prisma.$transaction(async (tx) => {
    const due = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Article"
      WHERE status = 'SCHEDULED'
        AND "deletedAt" IS NULL
        AND "scheduledAt" IS NOT NULL
        AND "scheduledAt" <= NOW()
      ORDER BY "scheduledAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 50
    `;

    let count = 0;
    for (const row of due) {
      const article = await tx.article.findUnique({ where: { id: row.id } });
      if (!article || article.status !== ArticleStatus.SCHEDULED) continue;
      await tx.article.update({
        where: { id: article.id },
        data: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: new Date(),
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
          actorId: article.authorId,
          action: "article.cron_publish",
          entityType: "Article",
          entityId: article.id,
        },
      });
      count += 1;
    }
    return { published: count, checked: due.length };
  });

  return NextResponse.json(published);
}
