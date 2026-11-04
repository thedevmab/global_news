import { prisma } from "@/lib/db";

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export async function recordFailedLogin(userId: string): Promise<{
  failedLoginCount: number;
  lockedUntil: Date | null;
}> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const failedLoginCount = user.failedLoginCount + 1;
  const lockedUntil =
    failedLoginCount >= MAX_FAILED_LOGINS
      ? new Date(Date.now() + LOCKOUT_MS)
      : user.lockedUntil;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount, lockedUntil },
    select: { failedLoginCount: true, lockedUntil: true },
  });
  return updated;
}

export function isAccountLocked(lockedUntil: Date | null | undefined): boolean {
  return Boolean(lockedUntil && lockedUntil > new Date());
}

export async function clearLoginFailures(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}
