import { prisma } from "@/lib/db";
import { RateLimitError } from "@/lib/errors";

export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<void> {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - (now.getTime() % opts.windowMs),
  );
  const id = `${opts.key}:${windowStart.getTime()}`;

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { id },
    create: { id, count: 1, windowStart },
    update: { count: { increment: 1 } },
  });

  if (bucket.count > opts.limit) {
    throw new RateLimitError();
  }
}
