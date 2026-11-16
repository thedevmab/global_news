import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { sanitizeSearchHighlight } from "@/lib/security/html";
import { getActiveCategories } from "@/server/articles/public";
import { getSearchAuthors } from "@/server/search/authors";
import { parseSearchParams } from "@/server/search/params";
import { searchPublished } from "@/server/search/query";

type Sp = Record<string, string | string[] | undefined>;

function categoryLabel(
  locale: Locale,
  nameEn: string | null | undefined,
  nameAm: string | null | undefined,
) {
  if (locale === "am" && nameAm) return nameAm;
  return nameEn || nameAm || "";
}

function typeLabel(
  dict: ReturnType<typeof getDictionary>,
  type: "article" | "video" | "podcast",
) {
  if (type === "video") return dict.search.typeVideo;
  if (type === "podcast") return dict.search.typePodcast;
  return dict.search.typeArticle;
}

function buildSearchHref(
  locale: Locale,
  params: ReturnType<typeof parseSearchParams>,
  page?: number,
) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.author) qs.set("author", params.author);
  if (params.sort && params.sort !== "relevance") qs.set("sort", params.sort);
  qs.set("language", params.language || "all");
  const p = page ?? params.page;
  if (p > 1) qs.set("page", String(p));
  const query = qs.toString();
  return localePath(locale, query ? `/search?${query}` : "/search");
}

const fieldClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground";

export async function SearchPage({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<Sp>;
}) {
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const params = parseSearchParams(sp, {
    defaultLanguage: locale,
    pageSize: 12,
  });

  const [categories, authors, results] = await Promise.all([
    getActiveCategories(),
    getSearchAuthors(),
    params.q
      ? searchPublished(params)
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 12,
          totalPages: 1,
        }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 font-serif text-3xl font-bold md:text-4xl">
        {dict.search.title}
      </h1>

      <form
        method="get"
        action={localePath(locale, "/search")}
        className="mb-8 space-y-3 rounded-lg border border-border bg-muted/30 p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            name="q"
            defaultValue={params.q}
            placeholder={dict.search.placeholder}
            aria-label={dict.search.title}
            className="h-11 flex-1"
            autoFocus={!params.q}
          />
          <Button type="submit" className="h-11 shrink-0 px-6">
            {dict.nav.search}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="block text-xs font-medium text-muted-foreground">
            {dict.search.filters.category}
            <select
              name="category"
              defaultValue={params.category}
              className={`mt-1 ${fieldClass}`}
            >
              <option value="">{dict.search.filters.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {categoryLabel(locale, c.nameEn, c.nameAm)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            {dict.search.filters.type}
            <select
              name="type"
              defaultValue={params.type}
              className={`mt-1 ${fieldClass}`}
            >
              <option value="all">{dict.search.filters.allTypes}</option>
              <option value="article">{dict.search.typeArticle}</option>
              <option value="video">{dict.search.typeVideo}</option>
              <option value="podcast">{dict.search.typePodcast}</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            {dict.search.filters.language}
            <select
              name="language"
              defaultValue={params.language || "all"}
              className={`mt-1 ${fieldClass}`}
            >
              <option value="all">{dict.search.filters.allLanguages}</option>
              <option value="en">{dict.search.filters.langEn}</option>
              <option value="am">{dict.search.filters.langAm}</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            {dict.search.filters.author}
            <select
              name="author"
              defaultValue={params.author}
              className={`mt-1 ${fieldClass}`}
            >
              <option value="">{dict.search.filters.allAuthors}</option>
              {authors.map((a) => (
                <option key={a.id} value={a.username}>
                  {a.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            {dict.search.filters.from}
            <input
              type="date"
              name="from"
              defaultValue={params.from}
              className={`mt-1 ${fieldClass}`}
            />
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            {dict.search.filters.to}
            <input
              type="date"
              name="to"
              defaultValue={params.to}
              className={`mt-1 ${fieldClass}`}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="block min-w-[10rem] flex-1 text-xs font-medium text-muted-foreground sm:flex-none">
            {dict.search.filters.sort}
            <select
              name="sort"
              defaultValue={params.sort}
              className={`mt-1 ${fieldClass}`}
            >
              <option value="relevance">{dict.search.filters.sortRelevance}</option>
              <option value="newest">{dict.search.filters.sortNewest}</option>
              <option value="oldest">{dict.search.filters.sortOldest}</option>
            </select>
          </label>
          {params.q ||
          params.category ||
          params.author ||
          params.from ||
          params.to ||
          params.type !== "all" ? (
            <Link
              href={localePath(locale, "/search")}
              className="inline-flex h-10 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
            >
              {dict.search.filters.clear}
            </Link>
          ) : null}
        </div>
      </form>

      {!params.q ? (
        <div>
          <p className="mb-4 text-muted-foreground">
            {dict.search.enterQuery}
          </p>
          <p className="mb-3 text-sm font-medium">{dict.search.tryCategories}</p>
          <ul className="flex flex-wrap gap-2">
            {categories.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link
                  href={localePath(locale, `/${c.slug}`)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  {categoryLabel(locale, c.nameEn, c.nameAm)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : results.items.length === 0 ? (
        <EmptyState
          title={dict.search.noResults}
          description={dict.search.tryCategories}
        >
          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={localePath(locale, `/${c.slug}`)}
                className="rounded-full border border-border px-3 py-1 text-sm"
              >
                {categoryLabel(locale, c.nameEn, c.nameAm)}
              </Link>
            ))}
          </div>
        </EmptyState>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {dict.search.resultsCount
              .replace("{count}", String(results.total))
              .replace("{query}", params.q)}
          </p>
          <ul className="space-y-6">
            {results.items.map((item) => {
              const cat = categoryLabel(
                locale,
                item.categoryNameEn,
                item.categoryNameAm,
              );
              const when = item.publishedAt
                ? format(item.publishedAt, "MMM d, yyyy")
                : null;
              return (
                <li key={`${item.type}-${item.id}`} className="border-b border-border pb-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{typeLabel(dict, item.type)}</Badge>
                    {cat ? (
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {cat}
                      </span>
                    ) : null}
                    {when ? (
                      <time
                        dateTime={item.publishedAt!.toISOString()}
                        className="text-xs text-muted-foreground"
                      >
                        {when}
                      </time>
                    ) : null}
                  </div>
                  <Link
                    href={item.href}
                    className="font-serif text-xl font-semibold hover:text-gvn-red"
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSearchHighlight(item.titleHl),
                      }}
                    />
                  </Link>
                  {item.authorName ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dict.article.by} {item.authorName}
                    </p>
                  ) : null}
                  {item.snippet ? (
                    <p
                      className="mt-2 text-sm leading-relaxed text-foreground/90"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSearchHighlight(item.snippet),
                      }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
          <Pagination
            className="mt-10"
            page={results.page}
            totalPages={results.totalPages}
            hrefForPage={(p) => buildSearchHref(locale, params, p)}
          />
        </>
      )}
    </div>
  );
}
