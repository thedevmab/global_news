import { describe, expect, it } from "vitest";
import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { updateUserRole, setUserSuspended } from "@/server/users/service";
import { ForbiddenError } from "@/lib/errors";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("super admin protections", () => {
  const prisma = new PrismaClient();

  it("refuses demoting the last super admin", async () => {
    const superAdmin = await prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN, deletedAt: null, status: UserStatus.ACTIVE },
    });
    expect(superAdmin).toBeTruthy();
    const count = await prisma.user.count({
      where: { role: Role.SUPER_ADMIN, deletedAt: null, status: UserStatus.ACTIVE },
    });
    if (count !== 1) return; // only assert when exactly one exists

    const actor = {
      id: superAdmin!.id,
      email: superAdmin!.email,
      name: superAdmin!.name,
      role: "SUPER_ADMIN" as const,
      status: "ACTIVE" as const,
    };

    await expect(
      updateUserRole(actor, superAdmin!.id, Role.ADMIN),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("unauthorized role cannot manage users", async () => {
    const actor = {
      id: "00000000-0000-0000-0000-000000000001",
      email: "ed@test",
      name: "Ed",
      role: "EDITOR" as const,
      status: "ACTIVE" as const,
    };
    await expect(
      setUserSuspended(actor, actor.id, true),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
