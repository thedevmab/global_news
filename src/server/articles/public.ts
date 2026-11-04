import {
  ArticleStatus,
  ContentLanguage,
  HomepageSlotType,
  Prisma,
  type AdSlotKey,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Locale } from "@/i18n";

type Lang = ContentLanguage | Locale;

const publishedWhere = (language?: Lang): Prisma.ArticleWhereInput => {
  const now = new Date();
  return {
    status: ArticleStatus.PUBLISHED,
    deletedAt: null,
    publishedAt: { lte: now },
    ...(language ? { language: language as ContentLanguage } : {}),
  };
};

export const publishedArticleWhere: Prisma.ArticleWhereInput = {
  status: ArticleStatus.PUBLISHED,
  deletedAt: null,
};

export const articleCardSelect = {
  id: true,
  headline: true,
  subheadline: true,
  slug: true,
  summary: true,
  language: true,
  publishedAt: true,
  readingTimeMinutes: true,
  isBreaking: true,
  isFeatured: true,
  viewCount: true,
  category: {
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAm: true,
      color: true,
    },
  },
  authorProfile: {
    select: {
      displayName: true,
      username: true,
    },
  },
  author: {
    select: {
      name: true,
    },
  },
  featuredMedia: {
    select: {
      id: true,
      storageKey: true,
      altText: true,
      width: true,
      height: true,
      caption: true,
      credit: true,
      variants: {
        select: { label: true, storageKey: true, width: true, height: true },
      },
    },
  },
} satisfies Prisma.ArticleSelect;

export type ArticleCardData = Prisma.ArticleGetPayload<{
  select: typeof articleCardSelect;
}>;

const articleDetailSelect = {
  ...articleCardSelect,
  body: true,
  seoTitle: true,
  seoDescription: true,
  updatedAt: true,
  createdAt: true,
  categoryId: true,
  tags: {
    select: {
      tagId: true,
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.ArticleSelect;

export type PublishedArticle = Prisma.ArticleGetPayload<{
  select: typeof articleDetailSelect;
}>;

export function isArticlePubliclyVisible(article: {
  status: string;
  deletedAt: Date | null;
  publishedAt?: Date | null;
}): boolean {
  if (article.status !== "PUBLISHED" || article.deletedAt !== null) {
    return false;
  }
  if (article.publishedAt && article.publishedAt > new Date()) return false;
  return true;
}

export async function getPublishedArticleBySlug(
  categorySlugOrSlug: string,
  slugOrLanguage?: string,
  maybeLanguage: Lang = "en",
) {
  // (slug) | (slug, language) | (categorySlug, slug, language?)
  if (
    slugOrLanguage === undefined ||
    slugOrLanguage === "en" ||
    slugOrLanguage === "am"
  ) {
    const slug = categorySlugOrSlug;
    const language = (slugOrLanguage ?? "en") as Lang;
    return prisma.article.findFirst({
      where: {
        ...publishedWhere(language),
        slug,
      },
      select: articleDetailSelect,
    });
  }

  return prisma.article.findFirst({
    where: {
      ...publishedWhere(maybeLanguage),
      slug: slugOrLanguage,
      category: { slug: categorySlugOrSlug, isActive: true },
    },
    select: articleDetailSelect,
  });
}

export async function listLatestArticles(opts: {
  page?: number;
  pageSize?: number;
  language?: Lang;
  excludeIds?: string[];
}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));
  const where: Prisma.ArticleWhereInput = {
    ...publishedWhere(opts.language),
    hideFromHomepage: false,
    ...(opts.excludeIds?.length ? { id: { notIn: opts.excludeIds } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: page * pageSize < total,
  };
}

export async function listPublishedArticles(opts?: {
  categoryId?: string;
  take?: number;
  skip?: number;
  language?: Lang;
}) {
  const where: Prisma.ArticleWhereInput = {
    ...publishedWhere(opts?.language),
    ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
  };
  return prisma.article.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: opts?.take ?? 20,
    skip: opts?.skip ?? 0,
    select: articleCardSelect,
  });
}

type ListOpts = {
  page?: number;
  pageSize?: number;
  language?: Lang;
};

export async function listByCategory(
  categorySlugOrOpts: string | (ListOpts & { categorySlug: string }),
  maybeOpts?: ListOpts,
) {
  const categorySlug =
    typeof categorySlugOrOpts === "string"
      ? categorySlugOrOpts
      : categorySlugOrOpts.categorySlug;
  const opts =
    typeof categorySlugOrOpts === "string"
      ? (maybeOpts ?? {})
      : categorySlugOrOpts;

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));

  const category = await prisma.category.findFirst({
    where: { slug: categorySlug, isActive: true },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, slug: true, nameEn: true, nameAm: true },
      },
    },
  });
  if (!category) return null;

  const where: Prisma.ArticleWhereInput = {
    ...publishedWhere(opts.language),
    categoryId: category.id,
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy: [
        { pinToCategory: "desc" },
        { publishedAt: "desc" },
        { id: "desc" },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    category,
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listByTag(
  tagSlugOrOpts: string | (ListOpts & { tagSlug: string }),
  maybeOpts?: ListOpts,
) {
  const tagSlug =
    typeof tagSlugOrOpts === "string"
      ? tagSlugOrOpts
      : tagSlugOrOpts.tagSlug;
  const opts =
    typeof tagSlugOrOpts === "string" ? (maybeOpts ?? {}) : tagSlugOrOpts;

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));

  const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
  if (!tag) return null;

  const where: Prisma.ArticleWhereInput = {
    ...publishedWhere(opts.language),
    tags: { some: { tagId: tag.id } },
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    tag,
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listByAuthor(
  usernameOrOpts: string | (ListOpts & { username: string }),
  maybeOpts?: ListOpts,
) {
  const username =
    typeof usernameOrOpts === "string"
      ? usernameOrOpts
      : usernameOrOpts.username;
  const opts =
    typeof usernameOrOpts === "string" ? (maybeOpts ?? {}) : usernameOrOpts;

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));

  const author = await prisma.authorProfile.findFirst({
    where: { username, isPublic: true },
    include: {
      photo: {
        select: { storageKey: true, altText: true, width: true, height: true },
      },
    },
  });
  if (!author) return null;

  const where: Prisma.ArticleWhereInput = {
    ...publishedWhere(opts.language),
    authorProfileId: author.id,
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    author,
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getRelatedArticles(
  articleOrId:
    | string
    | {
        id: string;
        categoryId: string;
        language: ContentLanguage;
        tags?: { tagId: string }[];
      },
  categoryIdOrLimit?: string | number,
  tagIds?: string[],
  maybeLimit?: number,
) {
  let id: string;
  let categoryId: string;
  let language: ContentLanguage = ContentLanguage.en;
  let tags: string[] = [];
  let limit = 4;

  if (typeof articleOrId === "string") {
    id = articleOrId;
    categoryId = String(categoryIdOrLimit || "");
    tags = tagIds ?? [];
    limit = maybeLimit ?? 4;
  } else {
    id = articleOrId.id;
    categoryId = articleOrId.categoryId;
    language = articleOrId.language;
    tags = articleOrId.tags?.map((t) => t.tagId) ?? [];
    limit = typeof categoryIdOrLimit === "number" ? categoryIdOrLimit : 4;
  }

  return prisma.article.findMany({
    where: {
      ...publishedWhere(language),
      id: { not: id },
      OR: [
        { categoryId },
        ...(tags.length ? [{ tags: { some: { tagId: { in: tags } } } }] : []),
      ],
    },
    select: articleCardSelect,
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
  });
}

export async function getBreakingNews(language?: Lang, limit = 5) {
  const now = new Date();
  return prisma.article.findMany({
    where: {
      ...publishedWhere(language),
      isBreaking: true,
      OR: [{ breakingExpiresAt: null }, { breakingExpiresAt: { gt: now } }],
    },
    select: {
      id: true,
      headline: true,
      slug: true,
      language: true,
      category: { select: { slug: true, nameEn: true, nameAm: true } },
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
  });
}

export async function getHomepageLeadAndSecondary(language?: Lang) {
  const slots = await prisma.homepageSlot.findMany({
    orderBy: [{ type: "asc" }, { position: "asc" }],
  });

  const ids = slots.map((s) => s.articleId);
  if (ids.length === 0) {
    return {
      lead: null as ArticleCardData | null,
      secondary: [] as ArticleCardData[],
    };
  }

  const live = await prisma.article.findMany({
    where: {
      id: { in: ids },
      ...publishedWhere(language),
      hideFromHomepage: false,
    },
    select: articleCardSelect,
  });
  const byId = new Map(live.map((a) => [a.id, a]));

  const leadSlot = slots.find((s) => s.type === HomepageSlotType.LEAD);
  const lead = leadSlot ? (byId.get(leadSlot.articleId) ?? null) : null;

  const secondary = slots
    .filter((s) => s.type === HomepageSlotType.SECONDARY)
    .sort((a, b) => a.position - b.position)
    .map((s) => byId.get(s.articleId))
    .filter((a): a is ArticleCardData => Boolean(a))
    .slice(0, 4);

  return { lead, secondary };
}

export type SearchHit = {
  id: string;
  headline: string;
  slug: string;
  summary: string;
  language: ContentLanguage;
  publishedAt: Date | null;
  category_slug: string;
  category_name_en: string;
  category_name_am: string | null;
  category_name: string;
  headline_hl: string;
  summary_hl: string;
  snippet: string;
  rank: number;
};

export async function searchArticles(opts: {
  query?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  language?: Lang;
  categorySlug?: string;
  sort?: "relevance" | "newest";
}) {
  const q = (opts.query ?? opts.q ?? "").trim();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));
  const offset = (page - 1) * pageSize;

  if (!q) {
    return {
      items: [] as SearchHit[],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }

  const language = opts.language ?? null;
  const categorySlug = opts.categorySlug ?? null;
  const sortNewest = opts.sort === "newest";

  const items = await prisma.$queryRaw<SearchHit[]>`
    SELECT
      a.id,
      a.headline,
      a.slug,
      a.summary,
      a.language,
      a."publishedAt",
      c.slug AS category_slug,
      c."nameEn" AS category_name_en,
      c."nameAm" AS category_name_am,
      c."nameEn" AS category_name,
      ts_headline(
        'english',
        a.headline,
        plainto_tsquery('english', ${q}),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=5'
      ) AS headline_hl,
      ts_headline(
        'english',
        a.summary,
        plainto_tsquery('english', ${q}),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=12'
      ) AS summary_hl,
      ts_headline(
        'english',
        a.summary,
        plainto_tsquery('english', ${q}),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=12'
      ) AS snippet,
      ts_rank(a."searchVector", plainto_tsquery('english', ${q})) AS rank
    FROM "Article" a
    INNER JOIN "Category" c ON c.id = a."categoryId"
    WHERE
      a.status = 'PUBLISHED'
      AND a."deletedAt" IS NULL
      AND a."publishedAt" <= NOW()
      AND a."searchVector" @@ plainto_tsquery('english', ${q})
      AND (${language}::text IS NULL OR a.language::text = ${language})
      AND (${categorySlug}::text IS NULL OR c.slug = ${categorySlug})
    ORDER BY
      CASE WHEN ${sortNewest} THEN 0 ELSE 1 END,
      CASE WHEN ${sortNewest} THEN EXTRACT(EPOCH FROM a."publishedAt") ELSE ts_rank(a."searchVector", plainto_tsquery('english', ${q})) END DESC,
      a."publishedAt" DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Article" a
    INNER JOIN "Category" c ON c.id = a."categoryId"
    WHERE
      a.status = 'PUBLISHED'
      AND a."deletedAt" IS NULL
      AND a."publishedAt" <= NOW()
      AND a."searchVector" @@ plainto_tsquery('english', ${q})
      AND (${language}::text IS NULL OR a.language::text = ${language})
      AND (${categorySlug}::text IS NULL OR c.slug = ${categorySlug})
  `;

  const total = Number(countRows[0]?.count ?? 0);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getHomepageCategorySections(
  language?: Lang,
  perCategory = 4,
) {
  const homepageCats = await prisma.homepageCategory.findMany({
    include: { category: true },
    orderBy: { position: "asc" },
  });

  const sections = await Promise.all(
    homepageCats
      .filter((hc) => hc.category.isActive)
      .map(async (hc) => {
        const articles = await prisma.article.findMany({
          where: {
            ...publishedWhere(language),
            categoryId: hc.categoryId,
            hideFromHomepage: false,
          },
          select: articleCardSelect,
          orderBy: [{ publishedAt: "desc" }],
          take: perCategory,
        });
        return { category: hc.category, articles };
      }),
  );

  return sections.filter((s) => s.articles.length > 0);
}

export async function listPublishedVideos(opts: {
  page?: number;
  pageSize?: number;
  language?: Lang;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));
  const now = new Date();
  const where: Prisma.VideoWhereInput = {
    status: ArticleStatus.PUBLISHED,
    deletedAt: null,
    publishedAt: { lte: now },
    ...(opts.language ? { language: opts.language as ContentLanguage } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        category: {
          select: { slug: true, nameEn: true, nameAm: true },
        },
      },
      orderBy: [{ publishedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.video.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPublishedVideoBySlug(slug: string) {
  const now = new Date();
  return prisma.video.findFirst({
    where: {
      slug,
      status: ArticleStatus.PUBLISHED,
      deletedAt: null,
      publishedAt: { lte: now },
    },
    include: {
      category: {
        select: { slug: true, nameEn: true, nameAm: true },
      },
    },
  });
}

export async function listPublishedPodcasts(opts: {
  page?: number;
  pageSize?: number;
  language?: Lang;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));
  const now = new Date();
  const where: Prisma.PodcastWhereInput = {
    status: ArticleStatus.PUBLISHED,
    deletedAt: null,
    publishedAt: { lte: now },
    ...(opts.language ? { language: opts.language as ContentLanguage } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.podcast.findMany({
      where,
      include: {
        category: {
          select: { slug: true, nameEn: true, nameAm: true },
        },
        audioMedia: {
          select: { storageKey: true, originalName: true },
        },
      },
      orderBy: [{ publishedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.podcast.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPublishedPodcastBySlug(slug: string) {
  const now = new Date();
  return prisma.podcast.findFirst({
    where: {
      slug,
      status: ArticleStatus.PUBLISHED,
      deletedAt: null,
      publishedAt: { lte: now },
    },
    include: {
      category: {
        select: { slug: true, nameEn: true, nameAm: true },
      },
      audioMedia: {
        select: { storageKey: true, originalName: true, mimeType: true },
      },
    },
  });
}

export async function getPublishedStaticPage(slug: string, language?: Lang) {
  return prisma.staticPage.findFirst({
    where: {
      slug,
      published: true,
      ...(language ? { language: language as ContentLanguage } : {}),
    },
  });
}

export async function getActiveAd(slotKey: AdSlotKey) {
  const now = new Date();
  const slot = await prisma.adSlot.findUnique({
    where: { key: slotKey },
    include: {
      advertisements: {
        where: {
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  return slot?.advertisements[0] ?? null;
}

export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getNavigationItems(location: string) {
  return prisma.navigationItem.findMany({
    where: { location, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getSiteSettingsRow() {
  return prisma.siteSetting.findUnique({ where: { id: "default" } });
}
