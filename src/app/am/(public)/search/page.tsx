import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getDictionary, localePath } from "@/i18n";
import { sanitizeSearchHighlight } from "@/lib/security/html";
import {
  getActiveCategories,
  searchArticles,
} from "@/server/articles/public";

export const metadata: Metadata = { title: "ፈልግ" };

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const locale = "am" as const;
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const page = Math.max(1, Number(sp.page || "1") || 1);

  const [result, categories] = await Promise.all([
    q
      ? searchArticles({ query: q, page, pageSize: 12, language: locale })
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 12,
          totalPages: 1,
        }),
    getActiveCategories(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl font-semibold">
        {dict.search.title}
      </h1>
      <form
        method="get"
        className="mb-8 flex gap-2"
        action={localePath(locale, "/search")}
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder={dict.search.placeholder}
          aria-label={dict.search.title}
        />
        <Button type="submit" variant="accent">
          {dict.nav.search}
        </Button>
      </form>

      {!q ? (
        <div>
          <p className="mb-4 text-muted-foreground">
            {dict.search.tryCategories}
          </p>
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={localePath(locale, `/${c.slug}`)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  {c.nameAm || c.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : result.items.length === 0 ? (
        <EmptyState
          title={dict.search.noResults}
          description={dict.search.tryCategories}
        />
      ) : (
        <>
          <ul className="space-y-6">
            {result.items.map((item) => (
              <li key={item.id} className="border-b border-border pb-6">
                <Link
                  href={localePath(
                    locale,
                    `/${item.category_slug}/${item.slug}`,
                  )}
                  className="font-serif text-xl font-semibold hover:text-gvn-red"
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: sanitizeSearchHighlight(item.headline_hl),
                    }}
                  />
                </Link>
                <p
                  className="mt-2 text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeSearchHighlight(item.summary_hl),
                  }}
                />
              </li>
            ))}
          </ul>
          <Pagination
            className="mt-10"
            page={result.page}
            totalPages={result.totalPages}
            hrefForPage={(p) =>
              localePath(
                locale,
                `/search?q=${encodeURIComponent(q)}${p > 1 ? `&page=${p}` : ""}`,
              )
            }
          />
        </>
      )}
    </div>
  );
}
