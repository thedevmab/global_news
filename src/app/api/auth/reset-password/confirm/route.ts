import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/security/tokens";
import { hashPassword, passwordSchema } from "@/lib/security/password";
import { revokeAllUserSessions } from "@/lib/auth";
import { z } from "zod";

export async function POST(req: Request) {
  const body = z
    .object({
      token: z.string().min(10),
      password: passwordSchema,
    })
    .parse(await req.json());

  const tokenHash = hashToken(body.token);
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(body.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
  await revokeAllUserSessions(record.userId);

  return NextResponse.json({ ok: true });
}
