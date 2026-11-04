import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  dbAvailable,
  disconnectTestPrisma,
  getTestPrisma,
} from "../helpers/db";
import {
  assertNotLastSuperAdmin,
  countActiveSuperAdmins,
} from "@/server/users/service";
import { ForbiddenError } from "@/lib/errors";
import { hashPassword } from "@/lib/security/password";

const run = await dbAvailable();

(run ? describe : describe.skip)("last super admin protection", () => {
  const prisma = getTestPrisma()!;
  const createdIds: string[] = [];

  beforeAll(async () => {
    // Ensure at least one disposable super admin exists for the suite
    const existing = await countActiveSuperAdmins();
    if (existing === 0) {
      const email = `super-${randomUUID()}@example.com`;
      const user = await prisma.user.create({
        data: {
          email,
          emailNormalized: email,
          name: "Temp Super",
          role: "SUPER_ADMIN",
          passwordHash: await hashPassword("ValidPassw0rd"),
        },
      });
      createdIds.push(user.id);
    }
  });

  afterAll(async () => {
    if (createdIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
    }
    await disconnectTestPrisma();
  });

  it("blocks demoting the sole remaining Super Admin", async () => {
    const supers = await prisma.user.findMany({
      where: {
        role: "SUPER_ADMIN",
        deletedAt: null,
        status: { not: "SUSPENDED" },
      },
      select: { id: true },
    });
    expect(supers.length).toBeGreaterThanOrEqual(1);

    // Temporarily demote extras so exactly one remains
    const [keep, ...extras] = supers;
    for (const extra of extras) {
      await prisma.user.update({
        where: { id: extra.id },
        data: { role: "ADMIN" },
      });
    }

    try {
      await expect(
        assertNotLastSuperAdmin(keep.id, { role: "ADMIN" }),
      ).rejects.toBeInstanceOf(ForbiddenError);

      await expect(
        assertNotLastSuperAdmin(keep.id, { status: "SUSPENDED" }),
      ).rejects.toBeInstanceOf(ForbiddenError);

      await expect(
        assertNotLastSuperAdmin(keep.id, { softDelete: true }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    } finally {
      for (const extra of extras) {
        await prisma.user.update({
          where: { id: extra.id },
          data: { role: "SUPER_ADMIN" },
        });
      }
    }
  });
});
