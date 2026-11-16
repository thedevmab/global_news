import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { articlePath, localePath, type Locale } from "@/i18n";
import {
  escapeIlike,
  type ParsedSearchParams,
  type SearchContentType,
  type SearchSort,
} from "./params";

export type SearchHit = {
  id: string;
  type: Exclude<SearchContentType, "all">;
  language: string;
  title: string;
  titleHl: string;
  snippet: string;
  slug: string;
  href: string;
  categorySlug: string | null;
  categoryNameEn: string | null;
  categoryNameAm: string | null;
  authorName: string | null;
  publishedAt: Date | null;
  rank: number;
};

type RawHit = {
  id: string;
  content_type: "article" | "video" | "podcast";
  language: string;
  title: string;
  title_hl: string;
  snippet: string;
  slug: string;
  category_slug: string | null;
  category_name_en: string | null;
  category_name_am: string | null;
  author_name: string | null;
  published_at: Date | null;
  rank: number;
};

function orderClause(sort: SearchSort): Prisma.Sql {
  if (sort === "newest") {
    return Prisma.raw(`published_at DESC NULLS LAST, rank DESC`);
  }
  if (sort === "oldest") {
    return Prisma.raw(`published_at ASC NULLS LAST, rank DESC`);
  }
  return Prisma.raw(`rank DESC, published_at DESC NULLS LAST`);
}

function toHref(row: RawHit): string {
  const locale: Locale = row.language === "am" ? "am" : "en";
  if (row.content_type === "article" && row.category_slug) {
    return articlePath({
      language: row.language,
      slug: row.slug,
      category: { slug: row.category_slug },
    });
  }
  if (row.content_type === "video") {
    return localePath(locale, `/videos/${row.slug}`);
  }
  return localePath(locale, `/podcasts/${row.slug}`);
}

export async function searchPublished(
  params: ParsedSearchParams,
): Promise<{
  items: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const {
    q,
    category,
    type,
    from,
    to,
    author,
    sort,
    language,
    page,
    pageSize,
  } = params;
  const offset = (page - 1) * pageSize;

  if (!q) {
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }

  const like = `%${escapeIlike(q)}%`;
  const categorySlug = category || null;
  const authorUsername = author || null;
  const lang = language || null;
  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : null;
  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : null;
  const includeArticles = type === "all" || type === "article";
  const includeVideos = type === "all" || type === "video";
  const includePodcasts = type === "all" || type === "podcast";
  // Author filter only applies to articles; skip media when author is set.
  const runVideos = includeVideos && !authorUsername;
  const runPodcasts = includePodcasts && !authorUsername;

  const articlePart = includeArticles
    ? Prisma.sql`
      SELECT
        a.id::text AS id,
        'article'::text AS content_type,
        a.language::text AS language,
        a.headline AS title,
        ts_headline(
          'simple',
          a.headline,
          websearch_to_tsquery('simple', ${q}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=5'
        ) AS title_hl,
        ts_headline(
          'simple',
          COALESCE(NULLIF(a.summary, ''), LEFT(a."bodyPlain", 400)),
          websearch_to_tsquery('simple', ${q}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=12'
        ) AS snippet,
        a.slug AS slug,
        c.slug AS category_slug,
        c."nameEn" AS category_name_en,
        c."nameAm" AS category_name_am,
        COALESCE(ap."displayName", u.name) AS author_name,
        a."publishedAt" AS published_at,
        GREATEST(
          ts_rank(a."searchVector", websearch_to_tsquery('simple', ${q})),
          ts_rank(a."searchVector", websearch_to_tsquery('english', ${q}))
        ) AS rank
      FROM "Article" a
      INNER JOIN "Category" c ON c.id = a."categoryId"
      INNER JOIN "User" u ON u.id = a."authorId"
      LEFT JOIN "AuthorProfile" ap ON ap.id = a."authorProfileId"
      WHERE
        a.status = 'PUBLISHED'
        AND a."deletedAt" IS NULL
        AND a."publishedAt" <= NOW()
        AND (
          a."searchVector" @@ websearch_to_tsquery('simple', ${q})
          OR a."searchVector" @@ websearch_to_tsquery('english', ${q})
          OR a.headline ILIKE ${like} ESCAPE '\\'
          OR a.summary ILIKE ${like} ESCAPE '\\'
          OR a."bodyPlain" ILIKE ${like} ESCAPE '\\'
          OR EXISTS (
            SELECT 1
            FROM "ArticleTag" at
            INNER JOIN "Tag" t ON t.id = at."tagId"
            WHERE at."articleId" = a.id AND t.name ILIKE ${like} ESCAPE '\\'
          )
          OR COALESCE(ap."displayName", u.name) ILIKE ${like} ESCAPE '\\'
        )
        AND (${lang}::text IS NULL OR a.language::text = ${lang})
        AND (${categorySlug}::text IS NULL OR c.slug = ${categorySlug})
        AND (${authorUsername}::text IS NULL OR ap.username = ${authorUsername})
        AND (${fromDate}::timestamptz IS NULL OR a."publishedAt" >= ${fromDate})
        AND (${toDate}::timestamptz IS NULL OR a."publishedAt" <= ${toDate})
    `
    : null;

  const videoPart = runVideos
    ? Prisma.sql`
      SELECT
        v.id::text AS id,
        'video'::text AS content_type,
        v.language::text AS language,
        v.title AS title,
        ts_headline(
          'simple',
          v.title,
          websearch_to_tsquery('simple', ${q}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=5'
        ) AS title_hl,
        ts_headline(
          'simple',
          COALESCE(v.description, ''),
          websearch_to_tsquery('simple', ${q}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=12'
        ) AS snippet,
        v.slug AS slug,
        c.slug AS category_slug,
        c."nameEn" AS category_name_en,
        c."nameAm" AS category_name_am,
        NULL::text AS author_name,
        v."publishedAt" AS published_at,
        GREATEST(
          ts_rank(v."searchVector", websearch_to_tsquery('simple', ${q})),
          ts_rank(v."searchVector", websearch_to_tsquery('english', ${q}))
        ) AS rank
      FROM "Video" v
      LEFT JOIN "Category" c ON c.id = v."categoryId"
      WHERE
        v.status = 'PUBLISHED'
        AND v."deletedAt" IS NULL
        AND v."publishedAt" IS NOT NULL
        AND v."publishedAt" <= NOW()
        AND (
          v."searchVector" @@ websearch_to_tsquery('simple', ${q})
          OR v."searchVector" @@ websearch_to_tsquery('english', ${q})
          OR v.title ILIKE ${like} ESCAPE '\\'
          OR COALESCE(v.description, '') ILIKE ${like} ESCAPE '\\'
        )
        AND (${lang}::text IS NULL OR v.language::text = ${lang})
        AND (${categorySlug}::text IS NULL OR c.slug = ${categorySlug})
        AND (${fromDate}::timestamptz IS NULL OR v."publishedAt" >= ${fromDate})
        AND (${toDate}::timestamptz IS NULL OR v."publishedAt" <= ${toDate})
    `
    : null;

  const podcastPart = runPodcasts
    ? Prisma.sql`
      SELECT
        p.id::text AS id,
        'podcast'::text AS content_type,
        p.language::text AS language,
        p.title AS title,
        ts_headline(
          'simple',
          p.title,
          websearch_to_tsquery('simple', ${q}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=5'
        ) AS title_hl,
        ts_headline(
          'simple',
          COALESCE(p."showNotes", ''),
          websearch_to_tsquery('simple', ${q}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=12'
        ) AS snippet,
        p.slug AS slug,
        c.slug AS category_slug,
        c."nameEn" AS category_name_en,
        c."nameAm" AS category_name_am,
        NULL::text AS author_name,
        p."publishedAt" AS published_at,
        GREATEST(
          ts_rank(p."searchVector", websearch_to_tsquery('simple', ${q})),
          ts_rank(p."searchVector", websearch_to_tsquery('english', ${q}))
        ) AS rank
      FROM "Podcast" p
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE
        p.status = 'PUBLISHED'
        AND p."deletedAt" IS NULL
        AND p."publishedAt" IS NOT NULL
        AND p."publishedAt" <= NOW()
        AND (
          p."searchVector" @@ websearch_to_tsquery('simple', ${q})
          OR p."searchVector" @@ websearch_to_tsquery('english', ${q})
          OR p.title ILIKE ${like} ESCAPE '\\'
          OR COALESCE(p."showNotes", '') ILIKE ${like} ESCAPE '\\'
        )
        AND (${lang}::text IS NULL OR p.language::text = ${lang})
        AND (${categorySlug}::text IS NULL OR c.slug = ${categorySlug})
        AND (${fromDate}::timestamptz IS NULL OR p."publishedAt" >= ${fromDate})
        AND (${toDate}::timestamptz IS NULL OR p."publishedAt" <= ${toDate})
    `
    : null;

  const parts = [articlePart, videoPart, podcastPart].filter(
    (p): p is Prisma.Sql => p !== null,
  );

  if (parts.length === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }

  let unionSql = parts[0]!;
  for (let i = 1; i < parts.length; i++) {
    unionSql = Prisma.sql`${unionSql} UNION ALL ${parts[i]!}`;
  }

  const items = await prisma.$queryRaw<RawHit[]>`
    SELECT * FROM (${unionSql}) AS hits
    ORDER BY ${orderClause(sort)}
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM (${unionSql}) AS hits
  `;

  const total = Number(countRows[0]?.count ?? 0);

  return {
    items: items.map((row) => ({
      id: row.id,
      type: row.content_type,
      language: row.language,
      title: row.title,
      titleHl: row.title_hl || row.title,
      snippet: row.snippet || "",
      slug: row.slug,
      href: toHref(row),
      categorySlug: row.category_slug,
      categoryNameEn: row.category_name_en,
      categoryNameAm: row.category_name_am,
      authorName: row.author_name,
      publishedAt: row.published_at,
      rank: Number(row.rank ?? 0),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

