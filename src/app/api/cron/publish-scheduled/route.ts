import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { timingSafeEqualString } from "@/lib/security/tokens";
import { publishDueScheduledArticles } from "@/server/articles/scheduled-publish";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || !token || !timingSafeEqualString(secret, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await publishDueScheduledArticles(50);

  // Clean old rate-limit buckets (login/contact/newsletter DB limiter)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.rateLimitBucket.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });

  return NextResponse.json({
    published: result.publishedIds.length,
    checked: result.publishedIds.length + result.skipped,
    skipped: result.skipped,
  });
}
