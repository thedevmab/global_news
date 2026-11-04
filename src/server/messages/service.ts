import { ContactStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/server/audit";
import { z } from "zod";

export async function listMessages(
  user: AuthUser,
  status?: ContactStatus,
  page = 1,
) {
  requirePermission(user, "contact:manage");
  const pageSize = 30;
  const where = status ? { status } : undefined;
  const [total, items] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function updateMessageStatus(
  user: AuthUser,
  id: string,
  status: ContactStatus,
) {
  requirePermission(user, "contact:manage");
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Message not found");
  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });
  await writeAudit({
    actorId: user.id,
    action: "contact.update_status",
    entityType: "ContactMessage",
    entityId: id,
    metadata: { status },
  });
  return updated;
}

export async function deleteMessage(user: AuthUser, id: string) {
  requirePermission(user, "contact:manage");
  await prisma.contactMessage.delete({ where: { id } });
  await writeAudit({
    actorId: user.id,
    action: "contact.delete",
    entityType: "ContactMessage",
    entityId: id,
  });
}

export const contactStatusSchema = z.nativeEnum(ContactStatus);
