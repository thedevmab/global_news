import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";
import { AuthError, ValidationError } from "@/lib/errors";
import { hashPassword, passwordSchema } from "@/lib/security/password";
import { generateToken, hashToken } from "@/lib/security/tokens";
import { absoluteUrl, normalizeEmail } from "@/lib/utils";

const RESET_TTL_MS = 30 * 60 * 1000;

export async function requestPasswordReset(email: string): Promise<{ sent: boolean }> {
  const emailNormalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { emailNormalized } });

  // Always return success-shaped response to avoid account enumeration
  if (!user || user.deletedAt || user.status === "SUSPENDED") {
    return { sent: true };
  }

  const raw = generateToken(32);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const resetUrl = absoluteUrl(
    `/login/reset?token=${encodeURIComponent(raw)}`,
  );
  const tpl = passwordResetEmail({ name: user.name, resetUrl });
  await sendEmail({ to: user.email, ...tpl });
  return { sent: true };
}

export async function consumePasswordResetToken(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  passwordSchema.parse(newPassword);
  const tokenHash = hashToken(rawToken);
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!token) throw new AuthError("Invalid or expired reset token");
  if (token.usedAt) throw new AuthError("Reset token already used");
  if (token.expiresAt < new Date()) {
    throw new AuthError("Reset token expired");
  }
  if (token.user.deletedAt || token.user.status === "SUSPENDED") {
    throw new AuthError("Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    const updated = await tx.passwordResetToken.updateMany({
      where: { id: token.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (updated.count !== 1) {
      throw new AuthError("Reset token already used");
    }
    await tx.user.update({
      where: { id: token.userId },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
  });

  await prisma.session.updateMany({
    where: { userId: token.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function assertResetTokenValid(rawToken: string): Promise<boolean> {
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!token) return false;
  if (token.usedAt) return false;
  if (token.expiresAt < new Date()) return false;
  return true;
}

export function assertPasswordPolicy(password: string): void {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || "Invalid password");
  }
}
