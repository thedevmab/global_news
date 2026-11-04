import { HomepageSlotType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { ValidationError } from "@/lib/errors";
import { writeAudit } from "@/server/audit";
import { z } from "zod";

const homepageSchema = z.object({
  leadArticleId: z.string().uuid().nullable(),
  secondaryArticleIds: z.array(z.string().uuid()).max(4),
});

export async function getHomepageLayout() {
  const slots = await prisma.homepageSlot.findMany({
    include: {
      article: {
        select: {
          id: true,
          headline: true,
          slug: true,
          status: true,
          publishedAt: true,
        },
      },
    },
    orderBy: [{ type: "asc" }, { position: "asc" }],
  });
  return slots;
}

export async function updateHomepageLayout(user: AuthUser, input: unknown) {
  requirePermission(user, "homepage:manage");
  const data = homepageSchema.parse(input);
  if (data.secondaryArticleIds.length > 4) {
    throw new ValidationError("At most 4 secondary slots allowed");
  }

  await prisma.$transaction(async (tx) => {
    await tx.homepageSlot.deleteMany();
    if (data.leadArticleId) {
      await tx.homepageSlot.create({
        data: {
          type: HomepageSlotType.LEAD,
          position: 1,
          articleId: data.leadArticleId,
        },
      });
    }
    for (let i = 0; i < data.secondaryArticleIds.length; i++) {
      await tx.homepageSlot.create({
        data: {
          type: HomepageSlotType.SECONDARY,
          position: i + 1,
          articleId: data.secondaryArticleIds[i],
        },
      });
    }
  });

  await writeAudit({
    actorId: user.id,
    action: "homepage.update",
    entityType: "HomepageSlot",
  });

  return getHomepageLayout();
}

const breakingSchema = z.object({
  articleId: z.string().uuid(),
  label: z.string().max(120).optional().nullable(),
  position: z.number().int().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function listBreakingNews() {
  const items = await prisma.breakingNewsItem.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });
  const articleIds = items.map((i) => i.articleId);
  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, headline: true, slug: true, status: true },
  });
  const byId = new Map(articles.map((a) => [a.id, a]));
  return items.map((item) => ({
    ...item,
    article: byId.get(item.articleId) ?? null,
  }));
}

export async function createBreakingItem(user: AuthUser, input: unknown) {
  requirePermission(user, "article:manage_breaking");
  const data = breakingSchema.parse(input);
  const item = await prisma.breakingNewsItem.create({
    data: {
      articleId: data.articleId,
      label: data.label ?? null,
      position: data.position ?? 0,
      expiresAt: data.expiresAt ?? null,
      isActive: data.isActive ?? true,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "breaking.create",
    entityType: "BreakingNewsItem",
    entityId: item.id,
  });
  return item;
}

export async function updateBreakingItem(
  user: AuthUser,
  id: string,
  input: unknown,
) {
  requirePermission(user, "article:manage_breaking");
  const data = breakingSchema.partial().parse(input);
  const item = await prisma.breakingNewsItem.update({
    where: { id },
    data,
  });
  await writeAudit({
    actorId: user.id,
    action: "breaking.update",
    entityType: "BreakingNewsItem",
    entityId: id,
  });
  return item;
}

export async function deleteBreakingItem(user: AuthUser, id: string) {
  requirePermission(user, "article:manage_breaking");
  await prisma.breakingNewsItem.delete({ where: { id } });
  await writeAudit({
    actorId: user.id,
    action: "breaking.delete",
    entityType: "BreakingNewsItem",
    entityId: id,
  });
}
