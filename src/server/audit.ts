import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function writeAudit(opts: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId ?? null,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      metadata: opts.metadata ?? undefined,
      ipAddress: opts.ipAddress ?? null,
    },
  });
}
