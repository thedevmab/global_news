import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/server/audit";
import { z } from "zod";

const adSchema = z.object({
  slotId: z.string().uuid(),
  name: z.string().min(1).max(120),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  destinationUrl: z.string().url().optional().nullable().or(z.literal("")),
  scriptHtml: z.string().max(10000).optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function listAdSlots() {
  return prisma.adSlot.findMany({
    include: {
      advertisements: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { key: "asc" },
  });
}

export async function createAdvertisement(user: AuthUser, input: unknown) {
  requirePermission(user, "ad:manage");
  const data = adSchema.parse(input);
  const ad = await prisma.advertisement.create({
    data: {
      slotId: data.slotId,
      name: data.name,
      imageUrl: data.imageUrl || null,
      destinationUrl: data.destinationUrl || null,
      scriptHtml: data.scriptHtml ?? null,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
      isActive: data.isActive ?? true,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "ad.create",
    entityType: "Advertisement",
    entityId: ad.id,
  });
  return ad;
}

export async function updateAdvertisement(
  user: AuthUser,
  id: string,
  input: unknown,
) {
  requirePermission(user, "ad:manage");
  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Advertisement not found");
  const data = adSchema.partial().parse(input);
  const ad = await prisma.advertisement.update({
    where: { id },
    data: {
      ...data,
      imageUrl: data.imageUrl === "" ? null : data.imageUrl,
      destinationUrl:
        data.destinationUrl === "" ? null : data.destinationUrl,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "ad.update",
    entityType: "Advertisement",
    entityId: id,
  });
  return ad;
}

export async function deleteAdvertisement(user: AuthUser, id: string) {
  requirePermission(user, "ad:manage");
  await prisma.advertisement.delete({ where: { id } });
  await writeAudit({
    actorId: user.id,
    action: "ad.delete",
    entityType: "Advertisement",
    entityId: id,
  });
}
