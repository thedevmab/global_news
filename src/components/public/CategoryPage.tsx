import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article/ArticleCard";
import { CurrencyConverterPanel } from "@/components/business/CurrencyConverterPanel";
import { PremierLeaguePanel } from "@/components/sports/PremierLeaguePanel";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { categoryBlurb } from "@/lib/category-blurb";
import { editorial } from "@/lib/editorial-images";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import {
  getActiveCategories,
  listByCategory,
} from "@/server/articles/public";

export async function CategoryPage({
  locale,
  categorySlug,
  page = 1,
  tab,
}: {
  locale: Locale;
  categorySlug: string;
  page?: number;
  tab?: string;
}) {
  const dict = getDictionary(locale);
  const [result, categories] = await Promise.all([
    listByCategory({
      categorySlug,
      page,
      pageSize: 12,
      language: locale,
    }),
    getActiveCategories(),
  ]);
  if (!result) notFound();

  const title =
    locale === "am" && result.category.nameAm
      ? result.category.nameAm
      : result.category.nameEn;

  const banner =
    mediaUrl(
      result.items.find((article) => article.featuredMedia)?.featuredMedia
        ?.storageKey,
    ) || editorial.skyline;

  const sidebar = categories.some((category) => category.slug === categorySlug)
    ? categories
    : [result.category, ...categories];

  const isSports = categorySlug === "sports";
  const isBusiness = categorySlug === "business";
  const activeTab =
    isSports && tab === "epl"
      ? "epl"
      : isBusiness && tab === "currency"
        ? "currency"
        : "news";
  const sportsBase = localePath(locale, "/sports");
  const businessBase = localePath(locale, "/business");

  return (
    <div className="min-w-0 max-w-full">
      <header className="relative isolate overflow-hidden bg-gvn-navy text-white">
        <Image
          src={banner}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gvn-deep-navy/92 via-gvn-navy/78 to-gvn-navy/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16">
          <p className="text-xs text-white/70">
            <Link href={localePath(locale, "/")} className="hover:text-white">
              {dict.nav.home}
            </Link>
            <span aria-hidden className="mx-1.5">
              ›
            </span>
            <span>{title}</span>
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">
            {categoryBlurb(
              dict,
              result.category.slug,
              result.category.description,
            )}
          </p>
        </div>
      </header>

      <div className="mx-auto grid min-w-0 max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:py-10">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <h2 className="mb-3 text-sm font-bold text-foreground">
            {dict.footer.categories}
          </h2>
          <ul className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">
            {sidebar.map((category) => {
              const active = category.slug === categorySlug;
              const name =
                locale === "am" && category.nameAm
                  ? category.nameAm
                  : category.nameEn;
              return (
                <li key={category.id} className="shrink-0 lg:shrink">
                  <Link
                    href={localePath(locale, `/${category.slug}`)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-full border px-3 py-1 text-sm lg:rounded-none lg:border-0 lg:border-l-2 lg:px-3 lg:py-1.5",
                      active
                        ? "border-gvn-red bg-gvn-red/10 font-semibold text-gvn-red lg:border-l-gvn-red"
                        : "border-border text-muted-foreground hover:text-foreground lg:border-l-transparent",
                    )}
                  >
                    {name}
                  </Link>
                  {category.slug === result.category.slug &&
                  result.category.children.length > 0 ? (
                    <ul className="mt-1 hidden space-y-1 pl-4 lg:block">
                      {result.category.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={localePath(locale, `/${child.slug}`)}
                            className="text-sm text-muted-foreground hover:text-gvn-red"
                          >
                            {locale === "am" && child.nameAm
                              ? child.nameAm
                              : child.nameEn}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0">
          {isSports ? (
            <div
              role="tablist"
              aria-label={title}
              className="mb-6 flex gap-1 border-b border-border"
            >
              <Link
                href={sportsBase}
                role="tab"
                aria-selected={activeTab === "news"}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-semibold",
                  activeTab === "news"
                    ? "border-gvn-red text-gvn-red"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {dict.sportsPage.newsTab}
              </Link>
              <Link
                href={`${sportsBase}?tab=epl`}
                role="tab"
                aria-selected={activeTab === "epl"}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-semibold",
                  activeTab === "epl"
                    ? "border-gvn-red text-gvn-red"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {dict.sportsPage.eplTab}
              </Link>
            </div>
          ) : null}

          {isBusiness ? (
            <div
              role="tablist"
              aria-label={title}
              className="mb-6 flex gap-1 border-b border-border"
            >
              <Link
                href={businessBase}
                role="tab"
                aria-selected={activeTab === "news"}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-semibold",
                  activeTab === "news"
                    ? "border-gvn-red text-gvn-red"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {dict.businessPage.newsTab}
              </Link>
              <Link
                href={`${businessBase}?tab=currency`}
                role="tab"
                aria-selected={activeTab === "currency"}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-semibold",
                  activeTab === "currency"
                    ? "border-gvn-red text-gvn-red"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {dict.businessPage.currencyTab}
              </Link>
            </div>
          ) : null}

          {isSports && activeTab === "epl" ? (
            <PremierLeaguePanel locale={locale} />
          ) : isBusiness && activeTab === "currency" ? (
            <CurrencyConverterPanel locale={locale} />
          ) : result.items.length === 0 ? (
            <EmptyState
              title={dict.home.emptyTitle}
              description={dict.home.emptyDescription}
            />
          ) : (
            <>
              <div className="divide-y divide-border">
                {result.items.map((article) => (
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
              <Pagination
                className="mt-8"
                page={result.page}
                totalPages={result.totalPages}
                hrefForPage={(p) =>
                  localePath(
                    locale,
                    p <= 1 ? `/${categorySlug}` : `/${categorySlug}?page=${p}`,
                  )
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
