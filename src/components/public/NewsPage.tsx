import Image from "next/image";
import Link from "next/link";
import { ArticleCard } from "@/components/article/ArticleCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { editorial } from "@/lib/editorial-images";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import {
  getActiveCategories,
  listLatestArticles,
} from "@/server/articles/public";

const PAGE_SIZE = 12;

export async function NewsPage({
  locale,
  page = 1,
}: {
  locale: Locale;
  page?: number;
}) {
  const dict = getDictionary(locale);
  const requestedPage = Math.max(1, page);
  const [firstPass, categories] = await Promise.all([
    listLatestArticles({
      page: requestedPage,
      pageSize: PAGE_SIZE,
    }),
    getActiveCategories(),
  ]);

  const result =
    requestedPage > firstPass.totalPages && firstPass.totalPages >= 1
      ? await listLatestArticles({
          page: firstPass.totalPages,
          pageSize: PAGE_SIZE,
        })
      : firstPass;

  const banner =
    mediaUrl(
      result.items.find((article) => article.featuredMedia)?.featuredMedia
        ?.storageKey,
    ) || editorial.skyline;

  const isFirstPage = result.page <= 1;
  const lead = isFirstPage ? result.items[0] : undefined;
  const secondary = isFirstPage ? result.items.slice(1, 5) : [];
  const rest = isFirstPage ? result.items.slice(5) : result.items;

  return (
    <div className="min-w-0 max-w-full">
      <header className="relative isolate overflow-hidden bg-gvn-navy text-white">
        <Image
          src={banner}
          alt=""
          fill
          priority
          className="object-cover gvn-hero-kenburns"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gvn-deep-navy/92 via-gvn-navy/78 to-gvn-navy/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="gvn-hero-copy">
            <p className="text-xs text-white/70">
              <Link href={localePath(locale, "/")} className="hover:text-white">
                {dict.nav.home}
              </Link>
              <span aria-hidden className="mx-1.5">
                ›
              </span>
              <span>{dict.home.latest}</span>
            </p>
            <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight md:text-5xl">
              {dict.home.latest}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">
              {dict.home.latestStandfirst}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-w-0 max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:py-10">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <h2 className="mb-3 text-sm font-bold text-foreground">
            {dict.footer.categories}
          </h2>
          <ul className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">
            <li className="shrink-0 lg:shrink">
              <Link
                href={localePath(locale, "/news")}
                aria-current="page"
                className={cn(
                  "block rounded-full border px-3 py-1 text-sm lg:rounded-none lg:border-0 lg:border-l-2 lg:px-3 lg:py-1.5",
                  "border-gvn-red bg-gvn-red/10 font-semibold text-gvn-red lg:border-l-gvn-red",
                )}
              >
                {dict.home.allFilter}
              </Link>
            </li>
            {categories.map((category) => {
              const name =
                locale === "am" && category.nameAm
                  ? category.nameAm
                  : category.nameEn;
              return (
                <li key={category.id} className="shrink-0 lg:shrink">
                  <Link
                    href={localePath(locale, `/${category.slug}`)}
                    className={cn(
                      "block rounded-full border px-3 py-1 text-sm lg:rounded-none lg:border-0 lg:border-l-2 lg:px-3 lg:py-1.5",
                      "border-border text-muted-foreground hover:text-foreground lg:border-l-transparent",
                    )}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0">
          {result.items.length === 0 ? (
            <EmptyState
              title={dict.home.emptyTitle}
              description={dict.home.emptyDescription}
            />
          ) : (
            <>
              {lead ? (
                <div className="mb-8">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gvn-red">
                    {dict.home.topStories}
                  </p>
                  <ArticleCard
                    article={lead}
                    locale={locale}
                    variant="lead"
                  />
                </div>
              ) : null}

              {secondary.length > 0 ? (
                <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {secondary.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      locale={locale}
                      variant="default"
                    />
                  ))}
                </div>
              ) : null}

              {rest.length > 0 ? (
                <>
                  {isFirstPage && (lead || secondary.length > 0) ? (
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {dict.home.latest}
                    </p>
                  ) : null}
                  <div className="divide-y divide-border">
                    {rest.map((article) => (
                      <div key={article.id} className="py-4 first:pt-0">
                        <ArticleCard
                          article={article}
                          locale={locale}
                          variant="horizontal"
                          thumb="wide"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              <Pagination
                className="mt-8"
                page={result.page}
                totalPages={result.totalPages}
                hrefForPage={(p) =>
                  localePath(locale, p <= 1 ? "/news" : `/news?page=${p}`)
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
