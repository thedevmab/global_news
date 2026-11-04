"use server";

import { AuthError as NextAuthError } from "next-auth";
import { headers } from "next/headers";
import { auth, revokeCurrentSession, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { hashPassword, passwordSchema } from "@/lib/security/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { generateToken, hashToken } from "@/lib/security/tokens";
import { absoluteUrl, normalizeEmail } from "@/lib/utils";
import { fail, ok, toActionError, type ActionResult } from "@/lib/action-result";
import { z } from "zod";
import { writeAudit } from "@/server/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const data = loginSchema.parse(input);
    await rateLimit({
      key: `login:${normalizeEmail(data.email)}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    const session = await auth();
    if (session?.user?.sessionId) {
      const h = await headers();
      const ipAddress =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        h.get("x-real-ip") ||
        null;
      const userAgent = h.get("user-agent") || null;
      await prisma.session.update({
        where: { id: session.user.sessionId },
        data: { ipAddress, userAgent },
      });
    }

    return ok({ redirectTo: "/admin" });
  } catch (err) {
    if (err instanceof NextAuthError) {
      return fail("Invalid email or password");
    }
    return toActionError(err);
  }
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    await revokeCurrentSession();
    await signOut({ redirect: false });
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

const resetRequestSchema = z.object({
  email: z.string().email(),
});

export async function requestPasswordResetAction(
  input: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const { email } = resetRequestSchema.parse(input);
    const emailNormalized = normalizeEmail(email);

    await rateLimit({
      key: `pwreset:${emailNormalized}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    const user = await prisma.user.findUnique({ where: { emailNormalized } });
    // Always return success to avoid account enumeration
    const message =
      "If an account exists for that email, a reset link has been sent.";

    if (user && !user.deletedAt && user.status !== "SUSPENDED") {
      const raw = generateToken(32);
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(raw),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      const resetUrl = absoluteUrl(`/reset-password?token=${raw}`);
      await sendEmail({
        to: user.email,
        subject: "Reset your GVN password",
        html: `<p>Hello ${user.name},</p><p>Reset your password using this link (valid 30 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, ignore this email.</p>`,
        text: `Reset your password: ${resetUrl}`,
      });

      await writeAudit({
        actorId: user.id,
        action: "auth.password_reset_requested",
        entityType: "User",
        entityId: user.id,
      });
    }

    return ok({ message });
  } catch (err) {
    return toActionError(err);
  }
}

const resetConfirmSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export async function confirmPasswordResetAction(
  input: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const data = resetConfirmSchema.parse(input);
    const tokenHash = hashToken(data.token);

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !record ||
      record.usedAt ||
      record.expiresAt < new Date() ||
      record.user.deletedAt
    ) {
      return fail("This reset link is invalid or has expired.");
    }

    const passwordHash = await hashPassword(data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await writeAudit({
      actorId: record.userId,
      action: "auth.password_reset_confirmed",
      entityType: "User",
      entityId: record.userId,
    });

    return ok({ message: "Password updated. You can sign in now." });
  } catch (err) {
    return toActionError(err);
  }
}
