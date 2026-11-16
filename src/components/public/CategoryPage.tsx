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
import { listByCategory } from "@/server/articles/public";

function SubnavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 whitespace-nowrap border-b-2 px-1 pb-2.5 text-sm font-semibold transition-colors",
        active
          ? "border-gvn-red text-gvn-red"
          : "border-transparent text-chrome-foreground/65 hover:text-chrome-foreground",
      )}
    >
      {children}
    </Link>
  );
}

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
  const result = await listByCategory({
    categorySlug,
    page,
    pageSize: 12,
    language: locale,
  });
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
  const categoryBase = localePath(locale, `/${categorySlug}`);
  const children = result.category.children;

  return (
    <div className="min-w-0 max-w-full">
      <nav
        aria-label={title}
        className="sticky top-16 z-30 border-b border-chrome-border bg-chrome text-chrome-foreground"
      >
        <div className="mx-auto flex max-w-7xl items-end gap-5 overflow-x-auto px-4 pt-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {isSports ? (
            <>
              <SubnavLink href={sportsBase} active={activeTab === "news"}>
                {dict.sportsPage.newsTab}
              </SubnavLink>
              <SubnavLink
                href={`${sportsBase}?tab=epl`}
                active={activeTab === "epl"}
              >
                {dict.sportsPage.eplTab}
              </SubnavLink>
            </>
          ) : isBusiness ? (
            <>
              <SubnavLink href={businessBase} active={activeTab === "news"}>
                {dict.businessPage.newsTab}
              </SubnavLink>
              <SubnavLink
                href={`${businessBase}?tab=currency`}
                active={activeTab === "currency"}
              >
                {dict.businessPage.currencyTab}
              </SubnavLink>
            </>
          ) : (
            <>
              <SubnavLink
                href={categoryBase}
                active={
                  children.length === 0 ||
                  categorySlug === result.category.slug
                }
              >
                {title}
              </SubnavLink>
              {children.map((child) => {
                const name =
                  locale === "am" && child.nameAm
                    ? child.nameAm
                    : child.nameEn;
                return (
                  <SubnavLink
                    key={child.id}
                    href={localePath(locale, `/${child.slug}`)}
                    active={categorySlug === child.slug}
                  >
                    {name}
                  </SubnavLink>
                );
              })}
            </>
          )}
        </div>
      </nav>

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

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
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
              hrefForPage={(p) => {
                const base = `/${categorySlug}`;
                const qs = new URLSearchParams();
                if (p > 1) qs.set("page", String(p));
                if (tab) qs.set("tab", tab);
                const q = qs.toString();
                return localePath(locale, q ? `${base}?${q}` : base);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
