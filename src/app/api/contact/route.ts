import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { isAppError } from "@/lib/errors";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(254),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(200).optional(),
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
    await rateLimit({
      key: `contact:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 422 });
    }

    if (parsed.data.website) {
      return NextResponse.json({ ok: true });
    }

    await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        ipAddress: ip === "unknown" ? null : ip,
      },
    });

    const forward = process.env.CONTACT_FORWARD_EMAIL;
    if (forward) {
      await sendEmail({
        to: forward,
        subject: `[GVN Contact] ${parsed.data.subject}`,
        html: `<p><strong>From:</strong> ${parsed.data.name} &lt;${parsed.data.email}&gt;</p><p>${parsed.data.message.replace(/\n/g, "<br/>")}</p>`,
        text: `${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
      }).catch(() => undefined);
    }

    return NextResponse.json({ ok: true });
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
