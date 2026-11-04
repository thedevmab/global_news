import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { getStorage } from "@/lib/storage";
import sharp from "sharp";
import FileType from "file-type";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const VARIANTS = [
  { label: "small", width: 480 },
  { label: "medium", width: 960 },
  { label: "large", width: 1600 },
] as const;

export async function uploadImage(
  user: AuthUser,
  file: { buffer: Buffer; originalName: string },
  meta?: { altText?: string; caption?: string; credit?: string },
) {
  requirePermission(user, "media:upload");
  if (file.buffer.byteLength > MAX_BYTES) {
    throw new ValidationError("Image exceeds 5MB limit");
  }
  const detected = await FileType.fromBuffer(file.buffer);
  if (!detected || !ALLOWED.has(detected.mime)) {
    throw new ValidationError("Invalid image type. Use JPG, PNG, or WebP.");
  }

  const storage = getStorage();
  const processed = await sharp(file.buffer)
    .rotate()
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const original = await storage.put({
    buffer: processed.data,
    extension: "webp",
    contentType: "image/webp",
  });

  const media = await prisma.media.create({
    data: {
      kind: "IMAGE",
      originalName: file.originalName,
      mimeType: "image/webp",
      sizeBytes: processed.data.byteLength,
      storageKey: original.storageKey,
      width: processed.info.width,
      height: processed.info.height,
      altText: meta?.altText || null,
      caption: meta?.caption || null,
      credit: meta?.credit || null,
      uploadedById: user.id,
    },
  });

  for (const v of VARIANTS) {
    const out = await sharp(file.buffer)
      .rotate()
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    const stored = await storage.put({
      buffer: out.data,
      extension: "webp",
      contentType: "image/webp",
    });
    await prisma.mediaVariant.create({
      data: {
        mediaId: media.id,
        label: v.label,
        width: out.info.width || v.width,
        height: out.info.height || 0,
        storageKey: stored.storageKey,
        sizeBytes: out.data.byteLength,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "media.upload",
      entityType: "Media",
      entityId: media.id,
    },
  });

  return media;
}

export async function listMedia(
  user: AuthUser,
  opts?: { page?: number; pageSize?: number; q?: string },
) {
  requirePermission(user, "media:upload");
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts?.pageSize ?? 24));
  const where = {
    deletedAt: null,
    ...(opts?.q
      ? {
          OR: [
            {
              originalName: {
                contains: opts.q,
                mode: "insensitive" as const,
              },
            },
            {
              altText: { contains: opts.q, mode: "insensitive" as const },
            },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { variants: true, uploadedBy: { select: { name: true } } },
    }),
  ]);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function updateMediaMeta(
  user: AuthUser,
  id: string,
  input: { altText?: string | null; caption?: string | null; credit?: string | null },
) {
  requirePermission(user, "media:manage");
  return prisma.media.update({
    where: { id },
    data: {
      altText: input.altText,
      caption: input.caption,
      credit: input.credit,
    },
  });
}

export async function deleteMedia(user: AuthUser, mediaId: string) {
  requirePermission(user, "media:manage");
  const used = await prisma.articleMedia.findFirst({
    where: {
      mediaId,
      article: { status: "PUBLISHED", deletedAt: null },
    },
  });
  if (used) {
    throw new ForbiddenError("Cannot delete media used by published articles");
  }
  const featured = await prisma.article.findFirst({
    where: {
      featuredMediaId: mediaId,
      status: "PUBLISHED",
      deletedAt: null,
    },
  });
  if (featured) {
    throw new ForbiddenError("Cannot delete featured image of published article");
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    include: { variants: true },
  });
  if (!media) return;

  const storage = getStorage();
  await storage.delete(media.storageKey);
  for (const v of media.variants) {
    await storage.delete(v.storageKey);
  }
  await prisma.media.update({
    where: { id: mediaId },
    data: { deletedAt: new Date() },
  });
}
