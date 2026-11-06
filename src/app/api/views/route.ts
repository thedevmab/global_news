import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAppError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({ articleId: z.string().uuid() });

const BOT_RE =
  /bot|crawler|spider|slurp|facebookexternalhit|preview|wget|curl|python|scrapy/i;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (BOT_RE.test(ua)) {
      return NextResponse.json({ ok: true, skipped: "bot" });
    }

    const ip = clientIp(req);
    await rateLimit({
      key: `views:${ip}`,
      limit: 120,
      windowMs: 60 * 1000,
    });

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

    const exists = await prisma.article.findFirst({
      where: { id: body.articleId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
