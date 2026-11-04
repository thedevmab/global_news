import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookies } from "next/headers";
import { createHash } from "crypto";

const schema = z.object({ articleId: z.string().uuid() });

const BOT_RE =
  /bot|crawler|spider|slurp|facebookexternalhit|preview|wget|curl|python|scrapy/i;

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) {
    return NextResponse.json({ ok: true, skipped: "bot" });
  }

  const body = schema.parse(await req.json());
  const jar = await cookies();
  const sid =
    jar.get("gvn_vid")?.value ||
    createHash("sha256")
      .update(`${Date.now()}-${Math.random()}`)
      .digest("hex")
      .slice(0, 32);

  const dedupeKey = `viewed_${body.articleId}`;
  if (jar.get(dedupeKey)?.value === "1") {
    return NextResponse.json({ ok: true, skipped: "session" });
  }

  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction([
    prisma.article.update({
      where: { id: body.articleId },
      data: { viewCount: { increment: 1 } },
    }),
    prisma.articleViewDaily.upsert({
      where: {
        articleId_day: { articleId: body.articleId, day },
      },
      create: { articleId: body.articleId, day, views: 1 },
      update: { views: { increment: 1 } },
    }),
  ]);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("gvn_vid", sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  res.cookies.set(dedupeKey, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
