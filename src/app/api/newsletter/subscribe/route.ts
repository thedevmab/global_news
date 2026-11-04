import { NextResponse } from "next/server";
import { z } from "zod";
import { SubscriberStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";
import { rateLimit } from "@/lib/security/rate-limit";
import { generateToken, hashToken } from "@/lib/security/tokens";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/utils";
import { isAppError } from "@/lib/errors";

const schema = z.object({
  email: z.string().email().max(254),
  name: z.string().max(120).optional(),
  website: z.string().max(200).optional(), // honeypot
});

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    await rateLimit({ key: `newsletter:${ip}`, limit: 10, windowMs: 60 * 60 * 1000 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 422 });
    }

    if (parsed.data.website) {
      // honeypot filled — pretend success
      return NextResponse.json({ ok: true });
    }

    const email = parsed.data.email.trim();
    const emailNormalized = normalizeEmail(email);
    const token = generateToken();
    const tokenHash = hashToken(token);
    const confirmationRequired =
      process.env.NEWSLETTER_CONFIRMATION_REQUIRED !== "false";

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { emailNormalized },
    });

    if (existing?.status === SubscriberStatus.ACTIVE) {
      return NextResponse.json({ ok: true });
    }

    if (existing) {
      await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          email,
          name: parsed.data.name || existing.name,
          tokenHash,
          status: confirmationRequired
            ? SubscriberStatus.PENDING
            : SubscriberStatus.ACTIVE,
          confirmedAt: confirmationRequired ? null : new Date(),
          unsubscribedAt: null,
        },
      });
    } else {
      await prisma.newsletterSubscriber.create({
        data: {
          email,
          emailNormalized,
          name: parsed.data.name,
          tokenHash,
          status: confirmationRequired
            ? SubscriberStatus.PENDING
            : SubscriberStatus.ACTIVE,
          confirmedAt: confirmationRequired ? null : new Date(),
        },
      });
    }

    if (confirmationRequired) {
      const confirmUrl = absoluteUrl(
        `/newsletter/confirm?token=${encodeURIComponent(token)}`,
      );
      await sendEmail({
        to: email,
        subject: "Confirm your GVN newsletter subscription",
        html: `<p>Please confirm your subscription to Global Voice Network:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`,
        text: `Confirm your subscription: ${confirmUrl}`,
      });
      return NextResponse.json({ ok: true, pending: true });
    }

    return NextResponse.json({ ok: true, pending: false });
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
