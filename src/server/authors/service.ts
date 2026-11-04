import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { writeAudit } from "@/server/audit";
import { z } from "zod";

const authorSchema = z.object({
  displayName: z.string().min(1).max(120),
  username: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  bio: z.string().max(5000).optional().nullable(),
  photoMediaId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().optional(),
  socialLinks: z.record(z.string()).optional().nullable(),
});

export async function listAuthors() {
  return prisma.authorProfile.findMany({
    orderBy: { displayName: "asc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
      photo: true,
      _count: { select: { articles: true } },
    },
  });
}

export async function createAuthor(user: AuthUser, input: unknown) {
  requirePermission(user, "author:manage");
  const data = authorSchema.parse(input);
  const author = await prisma.authorProfile.create({
    data: {
      displayName: data.displayName,
      username: data.username || slugify(data.displayName),
      bio: data.bio ?? null,
      photoMediaId: data.photoMediaId ?? null,
      userId: data.userId ?? null,
      isPublic: data.isPublic ?? true,
      socialLinks: data.socialLinks ?? undefined,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "author.create",
    entityType: "AuthorProfile",
    entityId: author.id,
  });
  return author;
}

export async function updateAuthor(
  user: AuthUser,
  id: string,
  input: unknown,
) {
  requirePermission(user, "author:manage");
  const existing = await prisma.authorProfile.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Author not found");
  const data = authorSchema.partial().parse(input);
  const author = await prisma.authorProfile.update({
    where: { id },
    data: {
      ...data,
      username:
        data.username ||
        (data.displayName ? slugify(data.displayName) : undefined),
      socialLinks: data.socialLinks ?? undefined,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "author.update",
    entityType: "AuthorProfile",
    entityId: id,
  });
  return author;
}

export async function deleteAuthor(user: AuthUser, id: string) {
  requirePermission(user, "author:manage");
  await prisma.authorProfile.delete({ where: { id } });
  await writeAudit({
    actorId: user.id,
    action: "author.delete",
    entityType: "AuthorProfile",
    entityId: id,
  });
}
