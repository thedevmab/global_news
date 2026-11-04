import { prisma } from "@/lib/db";

/**
 * Look up a permanent slug redirect for a request pathname.
 * Used by article pages and optionally by proxy.
 */
export async function findSlugRedirect(
  pathname: string,
): Promise<string | null> {
  const normalized = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;
  const row = await prisma.slugRedirect.findUnique({
    where: { fromPath: normalized },
    select: { toPath: true },
  });
  return row?.toPath ?? null;
}

export async function recordSlugRedirect(
  fromPath: string,
  toPath: string,
): Promise<void> {
  const from = fromPath.startsWith("/") ? fromPath : `/${fromPath}`;
  const to = toPath.startsWith("/") ? toPath : `/${toPath}`;
  if (from === to) return;
  await prisma.slugRedirect.upsert({
    where: { fromPath: from },
    create: { fromPath: from, toPath: to },
    update: { toPath: to },
  });
}
