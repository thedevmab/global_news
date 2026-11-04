import { NextResponse } from "next/server";
import { timingSafeEqualString } from "@/lib/security/tokens";
import { prisma } from "@/lib/db";
import { ArticleStatus } from "@prisma/client";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || !token || !timingSafeEqualString(secret, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Article"
    WHERE status = 'SCHEDULED'
      AND "deletedAt" IS NULL
      AND "scheduledAt" IS NOT NULL
      AND "scheduledAt" <= NOW()
    FOR UPDATE SKIP LOCKED
    LIMIT 50
  `;

  let published = 0;
  for (const row of due) {
    await prisma.$transaction(async (tx) => {
      const article = await tx.article.findUnique({ where: { id: row.id } });
      if (!article || article.status !== ArticleStatus.SCHEDULED) return;
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
      published += 1;
    });
  }

  return NextResponse.json({ published, checked: due.length });
}
