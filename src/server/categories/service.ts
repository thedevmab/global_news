import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { writeAudit } from "@/server/audit";
import { z } from "zod";

const categorySchema = z.object({
  nameEn: z.string().min(1).max(100),
  nameAm: z.string().max(100).optional().nullable(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    include: {
      parent: { select: { id: true, nameEn: true } },
      _count: { select: { articles: true } },
    },
  });
}

export async function createCategory(user: AuthUser, input: unknown) {
  requirePermission(user, "category:manage");
  const data = categorySchema.parse(input);
  const slug = data.slug || slugify(data.nameEn);
  const category = await prisma.category.create({
    data: {
      nameEn: data.nameEn,
      nameAm: data.nameAm ?? null,
      slug,
      description: data.description ?? null,
      color: data.color ?? null,
      parentId: data.parentId ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "category.create",
    entityType: "Category",
    entityId: category.id,
  });
  return category;
}

export async function updateCategory(
  user: AuthUser,
  id: string,
  input: unknown,
) {
  requirePermission(user, "category:manage");
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Category not found");
  const data = categorySchema.partial().parse(input);
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...data,
      slug: data.slug || (data.nameEn ? slugify(data.nameEn) : undefined),
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "category.update",
    entityType: "Category",
    entityId: id,
  });
  return category;
}

export async function deleteCategory(user: AuthUser, id: string) {
  requirePermission(user, "category:manage");
  const count = await prisma.article.count({ where: { categoryId: id } });
  if (count > 0) {
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  } else {
    await prisma.category.delete({ where: { id } });
  }
  await writeAudit({
    actorId: user.id,
    action: "category.delete",
    entityType: "Category",
    entityId: id,
  });
}
