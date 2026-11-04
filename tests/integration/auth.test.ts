import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  dbAvailable,
  disconnectTestPrisma,
  getTestPrisma,
} from "../helpers/db";
import {
  LOCKOUT_MS,
  MAX_FAILED_LOGINS,
  isAccountLocked,
  recordFailedLogin,
} from "@/server/auth/lockout";
import {
  assertResetTokenValid,
  consumePasswordResetToken,
} from "@/server/auth/password-reset";
import { hashPassword } from "@/lib/security/password";
import { generateToken, hashToken } from "@/lib/security/tokens";

const run = await dbAvailable();

(run ? describe : describe.skip)("auth lockout & reset tokens", () => {
  const prisma = getTestPrisma()!;
  const email = `lockout-${randomUUID()}@example.com`;
  let userId = "";

  beforeAll(async () => {
    const passwordHash = await hashPassword("ValidPassw0rd");
    const user = await prisma.user.create({
      data: {
        email,
        emailNormalized: email,
        name: "Lockout Test",
        passwordHash,
        role: "CONTRIBUTOR",
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await disconnectTestPrisma();
  });

  it("locks account after repeated failures", async () => {
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      await recordFailedLogin(userId);
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.failedLoginCount).toBeGreaterThanOrEqual(MAX_FAILED_LOGINS);
    expect(isAccountLocked(user.lockedUntil)).toBe(true);
    expect(user.lockedUntil!.getTime()).toBeGreaterThan(
      Date.now() + LOCKOUT_MS - 5_000,
    );
  });

  it("rejects expired reset tokens", async () => {
    const raw = generateToken(24);
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    expect(await assertResetTokenValid(raw)).toBe(false);
    await expect(
      consumePasswordResetToken(raw, "AnotherValid1"),
    ).rejects.toThrow(/expired|Invalid/i);
  });

  it("allows a reset token only once", async () => {
    const raw = generateToken(24);
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    expect(await assertResetTokenValid(raw)).toBe(true);
    await consumePasswordResetToken(raw, "BrandNewPass1");
    expect(await assertResetTokenValid(raw)).toBe(false);
    await expect(
      consumePasswordResetToken(raw, "BrandNewPass2"),
    ).rejects.toThrow(/used|Invalid|expired/i);
  });
});
