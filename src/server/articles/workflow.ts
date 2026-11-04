import {
  ArticleStatus,
  type Article,
  type Prisma,
} from "@prisma/client";
import {
  assertValidWorkflowTransition,
  canPerformTransition,
  transitionRequiresReason,
  type AuthUser,
} from "@/lib/rbac";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import type { TxClient } from "@/lib/db";

export async function transitionArticleStatus(
  tx: TxClient,
  opts: {
    article: Pick<Article, "id" | "status" | "authorId">;
    to: ArticleStatus;
    user: AuthUser;
    reason?: string;
    scheduledAt?: Date | null;
    urgentOverride?: boolean;
  },
) {
  const { article, to, user, reason, scheduledAt, urgentOverride } = opts;
  const from = article.status;

  if (urgentOverride) {
    if (
      !(
        user.role === "PUBLISHER" ||
        user.role === "ADMIN" ||
        user.role === "SUPER_ADMIN"
      )
    ) {
      throw new ForbiddenError("Urgent publish override not allowed");
    }
  } else {
    assertValidWorkflowTransition(from, to);
    if (!canPerformTransition(user, from, to, article.authorId)) {
      throw new ForbiddenError("You cannot perform this transition");
    }
  }

  if (transitionRequiresReason(from, to) && !reason?.trim()) {
    throw new ValidationError("A reason is required for this transition");
  }

  if (to === "SCHEDULED" && !scheduledAt) {
    throw new ValidationError("scheduledAt is required when scheduling");
  }

  const data: Prisma.ArticleUpdateInput = {
    status: to,
    updatedBy: { connect: { id: user.id } },
  };

  if (to === "PUBLISHED") {
    data.publishedAt = new Date();
    data.scheduledAt = null;
  }
  if (to === "SCHEDULED") {
    data.scheduledAt = scheduledAt!;
  }
  if (to === "DRAFT" && from === "PUBLISHED") {
    data.publishedAt = null;
  }
  if (to === "TRASH") {
    data.deletedAt = new Date();
  }
  if (from === "TRASH" && to === "DRAFT") {
    data.deletedAt = null;
  }

  const updated = await tx.article.update({
    where: { id: article.id },
    data,
  });

  await tx.articleStateLog.create({
    data: {
      articleId: article.id,
      fromStatus: from,
      toStatus: to,
      userId: user.id,
      reason: reason?.trim() || (urgentOverride ? "urgent_override" : null),
    },
  });

  await tx.auditLog.create({
    data: {
      actorId: user.id,
      action: urgentOverride
        ? "article.urgent_publish"
        : `article.transition.${from}_to_${to}`,
      entityType: "Article",
      entityId: article.id,
      metadata: { from, to, reason: reason ?? null },
    },
  });

  return updated;
}
