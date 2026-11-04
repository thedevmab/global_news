import Link from "next/link";
import { searchArticles, getActiveCategories } from "@/server/articles/public";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { getDictionary } from "@/i18n";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const dict = getDictionary("en");
  const q = (sp.q || "").trim();
  const page = Number(sp.page || "1");
  const categories = await getActiveCategories();
  const results = q
    ? await searchArticles({
        q,
        page,
        pageSize: 12,
        categorySlug: sp.category || undefined,
        sort: sp.sort === "newest" ? "newest" : "relevance",
      })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 font-serif text-4xl font-bold">{dict.search.title}</h1>
      <form className="mb-8 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={dict.search.placeholder}
          className="h-11 min-w-[240px] flex-1 rounded-md border border-border bg-background px-3"
        />
        <select
          name="category"
          defaultValue={sp.category || ""}
          className="h-11 rounded-md border border-border bg-background px-3"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.nameEn}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sp.sort || "relevance"}
          className="h-11 rounded-md border border-border bg-background px-3"
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
        </select>
        <button
          type="submit"
          className="h-11 rounded-md bg-gvn-navy px-4 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      {!q ? (
        <p className="text-muted-foreground">Enter a query to search GVN.</p>
      ) : results && results.items.length === 0 ? (
        <EmptyState
          title={dict.search.noResults}
          description={dict.search.tryCategories}
        >
          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/${c.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm"
              >
                {c.nameEn}
              </Link>
            ))}
          </div>
        </EmptyState>
      ) : results ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {results.total} result{results.total === 1 ? "" : "s"} for “{q}”
          </p>
          <ul className="space-y-6">
            {results.items.map((item) => (
              <li key={item.id} className="border-b border-border pb-4">
                <Link
                  href={`/${item.category_slug}/${item.slug}`}
                  className="text-xl font-semibold hover:text-gvn-red"
                >
                  {item.headline}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.category_name}
                </p>
                <p
                  className="mt-2 text-sm"
                  dangerouslySetInnerHTML={{ __html: item.snippet }}
                />
              </li>
            ))}
          </ul>
          <Pagination
            className="mt-8"
            page={results.page}
            totalPages={results.totalPages}
            hrefForPage={(p) => {
              const params = new URLSearchParams();
              params.set("q", q);
              params.set("page", String(p));
              if (sp.category) params.set("category", sp.category);
              if (sp.sort) params.set("sort", sp.sort);
              return `/search?${params.toString()}`;
            }}
          />
        </>
      ) : null}
    </div>
  );
}
