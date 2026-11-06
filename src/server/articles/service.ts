import {
  ArticleStatus,
  ContentLanguage,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  assertArticleOwnership,
  hasPermission,
  requirePermission,
  type AuthUser,
} from "@/lib/rbac";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  articleCreateSchema,
  articleUpdateSchema,
  workflowTransitionSchema,
  type ArticleCreateInput,
  type ArticleUpdateInput,
} from "@/lib/validation/article";
import { excerpt, readingTimeMinutes, slugify } from "@/lib/utils";
import { extractTipTapText, EMPTY_DOC } from "@/lib/tiptap-text";
import { generateToken, hashToken } from "@/lib/security/tokens";
import { transitionArticleStatus } from "@/server/articles/workflow";
import { writeAudit } from "@/server/audit";

async function ensureUniqueSlug(
  slugSource: string,
  language: ContentLanguage,
  excludeId?: string,
): Promise<{ slug: string; suggestions: string[] }> {
  const base = slugify(slugSource) || "article";
  const suggestions: string[] = [];
  let candidate = base;
  for (let i = 0; i < 8; i++) {
    const existing = await prisma.article.findFirst({
      where: {
        slug: candidate,
        language,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) {
      if (i > 0) {
        for (let s = 1; s <= 3; s++) suggestions.push(`${base}-${s + i}`);
      }
      return { slug: candidate, suggestions };
    }
    candidate = `${base}-${i + 2}`;
    suggestions.push(candidate);
  }
  throw new ValidationError("Could not generate a unique slug", {
    suggestions,
  });
}

function buildSummary(bodyText: string, headline: string): string {
  const source = bodyText.trim() || headline.trim();
  return excerpt(source, 300) || headline.slice(0, 300);
}

async function resolveCategoryId(categoryId?: string | null): Promise<string> {
  if (categoryId) {
    const found = await prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true },
    });
    if (found) return found.id;
  }
  const fallback = await prisma.category.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (!fallback) {
    throw new ValidationError("No active category available");
  }
  return fallback.id;
}

function snapshotArticle(article: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify({
      headline: article.headline,
      subheadline: article.subheadline,
      slug: article.slug,
      summary: article.summary,
      body: article.body,
      categoryId: article.categoryId,
      language: article.language,
      featuredMediaId: article.featuredMediaId,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      isFeatured: article.isFeatured,
      isBreaking: article.isBreaking,
      breakingExpiresAt: article.breakingExpiresAt,
      pinToCategory: article.pinToCategory,
      hideFromHomepage: article.hideFromHomepage,
      scheduledAt: article.scheduledAt,
      status: article.status,
    }),
  ) as Prisma.InputJsonValue;
}

export async function createArticle(user: AuthUser, input: unknown) {
  requirePermission(user, "article:create");
  const data: ArticleCreateInput = articleCreateSchema.parse(input);
  const text = extractTipTapText(data.body);
  const { slug } = await ensureUniqueSlug(data.headline, data.language);
  const categoryId = await resolveCategoryId(
    data.categoryId && data.categoryId !== "" ? data.categoryId : null,
  );
  const summary = buildSummary(text, data.headline);

  const article = await prisma.$transaction(async (tx) => {
    const created = await tx.article.create({
      data: {
        headline: data.headline,
        subheadline: null,
        slug,
        summary,
        body: data.body as Prisma.InputJsonValue,
        categoryId,
        language: data.language,
        authorId: user.id,
        authorProfileId: data.authorProfileId ?? null,
        featuredMediaId: data.featuredMediaId,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        updatedById: user.id,
        readingTimeMinutes: readingTimeMinutes(text),
        tags: data.tagIds.length
          ? { create: data.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    });

    await tx.articleRevision.create({
      data: {
        articleId: created.id,
        editorId: user.id,
        snapshot: snapshotArticle(created as unknown as Record<string, unknown>),
        note: "Initial draft",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "article.create",
        entityType: "Article",
        entityId: created.id,
      },
    });

    return created;
  });

  return article;
}

export async function updateArticle(
  user: AuthUser,
  id: string,
  input: unknown,
  opts?: { createRevision?: boolean; note?: string },
) {
  const existing = await prisma.article.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new NotFoundError("Article not found");

  assertArticleOwnership(user, existing.authorId);
  if (
    user.id === existing.authorId &&
    !hasPermission(user.role, "article:edit_own") &&
    !hasPermission(user.role, "article:edit_any")
  ) {
    requirePermission(user, "article:edit_own");
  }

  const data: ArticleUpdateInput = articleUpdateSchema.parse(input);

  if (data.isBreaking === true) {
    requirePermission(user, "article:manage_breaking");
  }

  const nextFeatured =
    data.featuredMediaId !== undefined
      ? data.featuredMediaId
      : existing.featuredMediaId;
  if (!nextFeatured) {
    throw new ValidationError("Featured image is required");
  }

  const headline = data.headline ?? existing.headline;
  const language = data.language ?? existing.language;
  const body = data.body ?? (existing.body as { type: "doc" });
  const text = extractTipTapText(body);
  if (!text || text.length < 3) {
    throw new ValidationError("Article body is required");
  }

  let nextSlug = existing.slug;
  if (
    existing.status === "DRAFT" &&
    data.headline !== undefined &&
    data.headline !== existing.headline
  ) {
    const unique = await ensureUniqueSlug(headline, language, id);
    nextSlug = unique.slug;
  }

  let nextCategoryId = existing.categoryId;
  if (data.categoryId !== undefined) {
    nextCategoryId = await resolveCategoryId(
      data.categoryId !== "" ? data.categoryId : null,
    );
  }

  const summary = buildSummary(text, headline);

  const updated = await prisma.$transaction(async (tx) => {
    if (data.tagIds) {
      await tx.articleTag.deleteMany({ where: { articleId: id } });
      if (data.tagIds.length) {
        await tx.articleTag.createMany({
          data: data.tagIds.map((tagId) => ({ articleId: id, tagId })),
        });
      }
    }

    const article = await tx.article.update({
      where: { id },
      data: {
        headline,
        subheadline: null,
        slug: nextSlug,
        summary,
        body: body as Prisma.InputJsonValue,
        categoryId: nextCategoryId,
        language,
        featuredMediaId: nextFeatured,
        ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle } : {}),
        ...(data.seoDescription !== undefined
          ? { seoDescription: data.seoDescription }
          : {}),
        ...(data.authorProfileId !== undefined
          ? { authorProfileId: data.authorProfileId }
          : {}),
        ...(data.isFeatured !== undefined
          ? { isFeatured: data.isFeatured }
          : {}),
        ...(data.isBreaking !== undefined
          ? { isBreaking: data.isBreaking }
          : {}),
        ...(data.breakingExpiresAt !== undefined
          ? { breakingExpiresAt: data.breakingExpiresAt }
          : {}),
        ...(data.pinToCategory !== undefined
          ? { pinToCategory: data.pinToCategory }
          : {}),
        ...(data.hideFromHomepage !== undefined
          ? { hideFromHomepage: data.hideFromHomepage }
          : {}),
        ...(data.scheduledAt !== undefined
          ? { scheduledAt: data.scheduledAt }
          : {}),
        updatedById: user.id,
        readingTimeMinutes: readingTimeMinutes(text || existing.summary),
      },
    });

    if (opts?.createRevision !== false) {
      await tx.articleRevision.create({
        data: {
          articleId: id,
          editorId: user.id,
          snapshot: snapshotArticle(
            article as unknown as Record<string, unknown>,
          ),
          note: opts?.note ?? null,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "article.update",
        entityType: "Article",
        entityId: id,
      },
    });

    return article;
  });

  return updated;
}

export async function autosaveArticle(
  user: AuthUser,
  id: string,
  input: unknown,
) {
  return updateArticle(user, id, input, {
    createRevision: false,
    note: "autosave",
  });
}

export async function listAdminArticles(opts: {
  user: AuthUser;
  q?: string;
  status?: ArticleStatus;
  categoryId?: string;
  language?: ContentLanguage;
  authorId?: string;
  page?: number;
  pageSize?: number;
}) {
  return listArticles(opts.user, opts);
}

export async function listArticles(
  user: AuthUser,
  opts: {
    q?: string;
    status?: ArticleStatus;
    categoryId?: string;
    language?: ContentLanguage;
    authorId?: string;
    page?: number;
    pageSize?: number;
  },
) {
  requirePermission(user, "dashboard:view");
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 20));
  const where: Prisma.ArticleWhereInput = {
    deletedAt: null,
  };

  if (!hasPermission(user.role, "article:edit_any")) {
    where.authorId = user.id;
  } else if (opts.authorId) {
    where.authorId = opts.authorId;
  }

  if (opts.status) where.status = opts.status;
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.language) where.language = opts.language;
  if (opts.q?.trim()) {
    where.OR = [
      { headline: { contains: opts.q.trim(), mode: "insensitive" } },
      { slug: { contains: opts.q.trim(), mode: "insensitive" } },
      { summary: { contains: opts.q.trim(), mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, nameEn: true, slug: true } },
        author: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
      },
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

export async function getArticleForEdit(user: AuthUser, id: string) {
  const article = await prisma.article.findFirst({
    where: { id },
    include: {
      category: true,
      tags: { include: { tag: true } },
      featuredMedia: { include: { variants: true } },
      author: { select: { id: true, name: true, email: true } },
      notes: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { author: { select: { id: true, name: true } } },
      },
      stateLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!article) throw new NotFoundError("Article not found");
  assertArticleOwnership(user, article.authorId);
  return article;
}

export async function transitionArticle(user: AuthUser, input: unknown) {
  const data = workflowTransitionSchema.parse(input);
  const article = await prisma.article.findFirst({ where: { id: data.articleId } });
  if (!article) throw new NotFoundError("Article not found");

  return prisma.$transaction((tx) =>
    transitionArticleStatus(tx, {
      article,
      to: data.to,
      user,
      reason: data.reason,
      scheduledAt: data.scheduledAt,
      urgentOverride: data.urgentOverride,
    }),
  );
}

export async function bulkTransitionArticles(
  user: AuthUser,
  articleIds: string[],
  to: ArticleStatus,
  reason?: string,
) {
  const results = [];
  for (const articleId of articleIds) {
    results.push(
      await transitionArticle(user, { articleId, to, reason }),
    );
  }
  return results;
}

export async function createPreviewToken(user: AuthUser, articleId: string) {
  const article = await prisma.article.findFirst({ where: { id: articleId } });
  if (!article) throw new NotFoundError("Article not found");
  assertArticleOwnership(user, article.authorId);

  const raw = generateToken(24);
  await prisma.previewToken.create({
    data: {
      articleId,
      tokenHash: hashToken(raw),
      createdById: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await writeAudit({
    actorId: user.id,
    action: "article.preview_token",
    entityType: "Article",
    entityId: articleId,
  });

  return { token: raw, expiresInHours: 24 };
}

export async function getArticleByPreviewToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.previewToken.findUnique({
    where: { tokenHash },
    include: {
      article: {
        include: {
          category: true,
          author: { select: { name: true } },
          featuredMedia: { include: { variants: true } },
          tags: { include: { tag: true } },
        },
      },
    },
  });
  if (!record || record.expiresAt < new Date()) {
    throw new NotFoundError("Preview link expired or invalid");
  }
  return record.article;
}

export async function listRevisions(user: AuthUser, articleId: string) {
  const article = await prisma.article.findFirst({ where: { id: articleId } });
  if (!article) throw new NotFoundError("Article not found");
  assertArticleOwnership(user, article.authorId);

  return prisma.articleRevision.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
    include: { editor: { select: { id: true, name: true, email: true } } },
  });
}

export async function suggestSlug(
  headline: string,
  language: ContentLanguage,
  excludeId?: string,
) {
  return ensureUniqueSlug(slugify(headline), language, excludeId);
}

export { EMPTY_DOC };
