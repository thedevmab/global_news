import { NextResponse } from "next/server";
import { z } from "zod";
import { SubscriberStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/security/tokens";

const schema = z.object({
  token: z.string().min(10).max(200),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 422 });
  }

  const tokenHash = hashToken(parsed.data.token);
  const sub = await prisma.newsletterSubscriber.findFirst({
    where: { tokenHash },
  });

  if (!sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.newsletterSubscriber.update({
    where: { id: sub.id },
    data: {
      status: SubscriberStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(
      new URL("/newsletter/unsubscribe?error=missing", req.url),
    );
  }

  const tokenHash = hashToken(token);
  const sub = await prisma.newsletterSubscriber.findFirst({
    where: { tokenHash },
  });

  if (sub) {
    await prisma.newsletterSubscriber.update({
      where: { id: sub.id },
      data: {
        status: SubscriberStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
    });
  }

  return NextResponse.redirect(
    new URL(
      `/newsletter/unsubscribe?${sub ? "done=1" : "error=invalid"}`,
      req.url,
    ),
  );
}
