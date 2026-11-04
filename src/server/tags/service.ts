import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { writeAudit } from "@/server/audit";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

export async function listTags(q?: string) {
  return prisma.tag.findMany({
    where: q
      ? { name: { contains: q, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
}

export async function createTag(user: AuthUser, input: unknown) {
  requirePermission(user, "tag:manage");
  const data = tagSchema.parse(input);
  const tag = await prisma.tag.create({
    data: {
      name: data.name,
      slug: data.slug || slugify(data.name),
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "tag.create",
    entityType: "Tag",
    entityId: tag.id,
  });
  return tag;
}

export async function updateTag(user: AuthUser, id: string, input: unknown) {
  requirePermission(user, "tag:manage");
  const data = tagSchema.partial().parse(input);
  const tag = await prisma.tag.update({
    where: { id },
    data: {
      ...data,
      slug: data.slug || (data.name ? slugify(data.name) : undefined),
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "tag.update",
    entityType: "Tag",
    entityId: id,
  });
  return tag;
}

export async function mergeTags(
  user: AuthUser,
  sourceId: string,
  targetId: string,
) {
  requirePermission(user, "tag:manage");
  if (sourceId === targetId) {
    throw new ValidationError("Cannot merge a tag into itself");
  }
  const [source, target] = await Promise.all([
    prisma.tag.findUnique({ where: { id: sourceId } }),
    prisma.tag.findUnique({ where: { id: targetId } }),
  ]);
  if (!source || !target) throw new NotFoundError("Tag not found");

  await prisma.$transaction(async (tx) => {
    const links = await tx.articleTag.findMany({ where: { tagId: sourceId } });
    for (const link of links) {
      const exists = await tx.articleTag.findUnique({
        where: {
          articleId_tagId: { articleId: link.articleId, tagId: targetId },
        },
      });
      if (!exists) {
        await tx.articleTag.create({
          data: { articleId: link.articleId, tagId: targetId },
        });
      }
    }
    await tx.articleTag.deleteMany({ where: { tagId: sourceId } });
    await tx.tag.delete({ where: { id: sourceId } });
  });

  await writeAudit({
    actorId: user.id,
    action: "tag.merge",
    entityType: "Tag",
    entityId: targetId,
    metadata: { sourceId, targetId },
  });
}

export async function deleteTag(user: AuthUser, id: string) {
  requirePermission(user, "tag:manage");
  await prisma.articleTag.deleteMany({ where: { tagId: id } });
  await prisma.tag.delete({ where: { id } });
  await writeAudit({
    actorId: user.id,
    action: "tag.delete",
    entityType: "Tag",
    entityId: id,
  });
}
