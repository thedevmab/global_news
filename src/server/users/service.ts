import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { hashPassword, passwordSchema } from "@/lib/security/password";
import { normalizeEmail } from "@/lib/utils";
import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  password: passwordSchema,
  role: z.nativeEnum(Role),
});

async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function countActiveSuperAdmins(): Promise<number> {
  return prisma.user.count({
    where: {
      role: Role.SUPER_ADMIN,
      status: { not: UserStatus.SUSPENDED },
      deletedAt: null,
    },
  });
}

/**
 * Prevent demoting, suspending, or deleting the last Super Admin.
 */
export async function assertNotLastSuperAdmin(
  targetUserId: string,
  next: { role?: Role; status?: UserStatus; softDelete?: boolean },
): Promise<void> {
  const target = await prisma.user.findFirst({
    where: { id: targetUserId, deletedAt: null },
  });
  if (!target) throw new NotFoundError("User not found");
  if (target.role !== Role.SUPER_ADMIN) return;

  const wouldLoseSuper =
    (next.role !== undefined && next.role !== Role.SUPER_ADMIN) ||
    next.status === UserStatus.SUSPENDED ||
    next.softDelete === true;

  if (!wouldLoseSuper) return;

  const supers = await countActiveSuperAdmins();
  if (supers <= 1) {
    throw new ForbiddenError("Cannot remove or demote the last Super Admin");
  }
}

export async function listUsers(actor: AuthUser) {
  requirePermission(actor, "user:manage");
  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function updateUser(
  actor: AuthUser,
  id: string,
  input: unknown,
) {
  requirePermission(actor, "user:manage");
  const schema = z.object({
    name: z.string().min(1).max(120).optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    password: passwordSchema.optional(),
  });
  const data = schema.parse(input);
  if (data.role) {
    await updateUserRole(actor, id, data.role);
  }
  if (data.status === UserStatus.SUSPENDED) {
    await setUserSuspended(actor, id, true);
  } else if (data.status === UserStatus.ACTIVE) {
    await setUserSuspended(actor, id, false);
  }
  const passwordHash = data.password
    ? await hashPassword(data.password)
    : undefined;
  if (data.name || passwordHash) {
    await prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
  }
  return prisma.user.findUniqueOrThrow({ where: { id } });
}

export async function deleteUser(actor: AuthUser, id: string) {
  requirePermission(actor, "user:manage");
  const target = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
  if (!target) throw new NotFoundError("User not found");
  if (target.role === Role.SUPER_ADMIN) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenError("Cannot delete Super Admin");
    }
    const count = await prisma.user.count({
      where: {
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
    });
    if (count <= 1) {
      throw new ForbiddenError("Cannot delete the last Super Admin");
    }
  }
  if (actor.id === id) {
    throw new ForbiddenError("You cannot delete your own account");
  }
  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: UserStatus.SUSPENDED },
  });
  await revokeAllUserSessions(id);
}

export async function createUser(actor: AuthUser, input: unknown) {
  requirePermission(actor, "user:manage");
  const data = createUserSchema.parse(input);
  if (data.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
    throw new ForbiddenError("Only Super Admins can create Super Admins");
  }
  if (data.role === Role.VISITOR) {
    throw new ValidationError("Cannot create visitor staff accounts");
  }
  const emailNormalized = normalizeEmail(data.email);
  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      email: data.email.trim(),
      emailNormalized,
      name: data.name,
      passwordHash,
      role: data.role,
      status: UserStatus.ACTIVE,
    },
  });
}

export async function updateUserRole(
  actor: AuthUser,
  userId: string,
  role: Role,
) {
  requirePermission(actor, "user:manage");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.deletedAt) throw new NotFoundError("User not found");

  if (target.role === Role.SUPER_ADMIN || role === Role.SUPER_ADMIN) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenError("Cannot modify Super Admin roles");
    }
  }

  if (target.role === Role.SUPER_ADMIN && role !== Role.SUPER_ADMIN) {
    const count = await prisma.user.count({
      where: {
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
    });
    if (count <= 1) {
      throw new ForbiddenError("Cannot demote the last Super Admin");
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function setUserSuspended(
  actor: AuthUser,
  userId: string,
  suspended: boolean,
) {
  requirePermission(actor, "user:manage");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundError("User not found");
  if (target.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
    throw new ForbiddenError("Cannot suspend Super Admin");
  }
  if (target.role === Role.SUPER_ADMIN && suspended) {
    const count = await prisma.user.count({
      where: {
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
    });
    if (count <= 1) {
      throw new ForbiddenError("Cannot suspend the last Super Admin");
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: suspended ? UserStatus.SUSPENDED : UserStatus.ACTIVE },
  });
  if (suspended) {
    await revokeAllUserSessions(userId);
  }
  return updated;
}
