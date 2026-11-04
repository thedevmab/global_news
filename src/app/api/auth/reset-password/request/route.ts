import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";
import { generateToken, hashToken } from "@/lib/security/tokens";
import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { z } from "zod";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  try {
    await rateLimit({ key: `reset:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 });
  } catch {
    return NextResponse.json({ ok: true });
  }

  const body = z.object({ email: z.string().email() }).parse(await req.json());
  const user = await prisma.user.findUnique({
    where: { emailNormalized: normalizeEmail(body.email) },
  });

  // Always generic response
  if (user && !user.deletedAt && user.status === "ACTIVE") {
    const raw = generateToken(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    const url = `${getSiteUrl()}/reset-password?token=${raw}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your GVN password",
      html: `<p>Reset your password (expires in 30 minutes):</p><p><a href="${url}">${url}</a></p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
