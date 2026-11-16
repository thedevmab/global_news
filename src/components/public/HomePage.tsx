import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard } from "@/components/article/ArticleCard";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeMediaSection } from "@/components/home/HomeMediaSection";
import { LoadMoreArticles } from "@/components/home/LoadMoreArticles";
import { RecentNewsTicker } from "@/components/home/RecentNewsTicker";
import { TopStoriesBand } from "@/components/home/TopStoriesBand";
import { AdSlot } from "@/components/media/AdSlot";
import { EmptyState } from "@/components/ui/empty-state";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { categoryBlurb } from "@/lib/category-blurb";
import { editorial, editorialFallback } from "@/lib/editorial-images";
import { mediaUrl } from "@/lib/media-url";
import { parseSiteSettings } from "@/lib/site-settings";
import { cn } from "@/lib/utils";
import {
  getActiveCategories,
  getHomepageCategorySections,
  getHomepageLeadAndSecondary,
  getSiteSettingsRow,
  listLatestArticles,
  listRecentHeadlines,
} from "@/server/articles/public";
import type { ArticleCardData } from "@/server/articles/public";

const LATEST_PAGE_SIZE = 12;

function catName(
  locale: Locale,
  cat: { nameEn: string; nameAm: string | null },
) {
  return locale === "am" && cat.nameAm ? cat.nameAm : cat.nameEn;
}

function SectionHeading({
  id,
  title,
  href,
  label,
}: {
  id: string;
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3 border-b border-border pb-3">
      <div>
        <span aria-hidden className="mb-2 block h-0.5 w-8 bg-gvn-red" />
        <h2
          id={id}
          className="text-xl font-bold tracking-tight text-gvn-navy dark:text-white"
        >
          {title}
        </h2>
      </div>
      {href && label ? (
        <Link
          href={href}
          className="shrink-0 pb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-gvn-red"
        >
          {label}
        </Link>
      ) : null}
    </div>
  );
}

export async function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [
    { lead, secondary },
    latest,
    recentHeadlines,
    sections,
    settingsRow,
    categories,
  ] = await Promise.all([
    // Homepage surfaces all published languages so Amharic/English posts from
    // the dashboard both appear on / and /am (category pages stay locale-scoped).
    getHomepageLeadAndSecondary(),
    listLatestArticles({ page: 1, pageSize: LATEST_PAGE_SIZE }),
    listRecentHeadlines({ hours: 12, limit: 20 }),
    getHomepageCategorySections(locale, 1),
    getSiteSettingsRow(),
    getActiveCategories(),
  ]);
  const settings = parseSiteSettings(settingsRow?.data);

  let heroLead: ArticleCardData | null = null;
  let heroRail: ArticleCardData[] = [];

  if (lead || secondary.length > 0) {
    heroLead = lead ?? secondary[0] ?? null;
    const curatedRail = (lead ? secondary : secondary.slice(1)).filter(
      (article) => article.id !== heroLead?.id,
    );
    const pool = latest.items.filter((article) => article.id !== heroLead?.id);
    const railIds = new Set(curatedRail.map((article) => article.id));
    heroRail = [
      ...curatedRail,
      ...pool.filter((article) => !railIds.has(article.id)),
    ].slice(0, 4);
  } else if (latest.items.length > 0) {
    heroLead = latest.items[0] ?? null;
    heroRail = latest.items
      .filter((article) => article.id !== heroLead?.id)
      .slice(0, 4);
  }

  const railIds = new Set(heroRail.map((article) => article.id));
  const pool = latest.items.filter((article) => article.id !== heroLead?.id);
  const uniqueLatest = pool.filter((article) => !railIds.has(article.id));
  const latestRows =
    uniqueLatest.length >= 4 ? uniqueLatest.slice(0, 6) : pool.slice(0, 5);

  const used = new Set<string>([
    ...(heroLead ? [heroLead.id] : []),
    ...heroRail.map((article) => article.id),
    ...latestRows.map((article) => article.id),
  ]);

  const tiles: {
    id: string;
    slug: string;
    name: string;
    description: string;
    image: string | null;
    color: string | null;
  }[] = [];
  const seen = new Set<string>();
  for (const section of sections) {
    if (tiles.length >= 6) break;
    seen.add(section.category.id);
    tiles.push({
      id: section.category.id,
      slug: section.category.slug,
      name: catName(locale, section.category),
      description: categoryBlurb(
        dict,
        section.category.slug,
        section.category.description,
      ),
      image: mediaUrl(section.articles[0]?.featuredMedia?.storageKey),
      color: section.category.color,
    });
  }
  for (const category of categories) {
    if (tiles.length >= 6) break;
    if (seen.has(category.id)) continue;
    tiles.push({
      id: category.id,
      slug: category.slug,
      name: catName(locale, category),
      description: categoryBlurb(dict, category.slug, category.description),
      image: null,
      color: category.color,
    });
  }

  const hasArticles = Boolean(heroLead || latest.items.length > 0);

  if (!hasArticles) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="sr-only">{dict.siteName}</h1>
        <EmptyState
          title={dict.home.emptyTitle}
          description={dict.home.emptyDescription}
          className="border-solid border-gvn-navy/10 bg-card shadow-sm"
        />
        <div className="mt-10">
          <Suspense fallback={null}>
            <HomeMediaSection locale={locale} />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="sr-only">{dict.siteName}</h1>

      <RecentNewsTicker
        locale={locale}
        label={dict.home.justIn}
        items={recentHeadlines.map((article) => ({
          id: article.id,
          headline: article.headline,
          slug: article.slug,
          language: article.language,
          categorySlug: article.category.slug,
        }))}
      />

      {heroLead ? <HomeHero article={heroLead} locale={locale} /> : null}
      {heroRail.length > 0 ? (
        <TopStoriesBand articles={heroRail} locale={locale} />
      ) : null}

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 md:py-10">
        <Suspense fallback={null}>
          <AdSlot slotKey="MIDDLE" />
        </Suspense>

        {latestRows.length > 0 || tiles.length > 0 ? (
          <section
            className={cn(
              "grid items-start gap-10 md:gap-12",
              latestRows.length > 0 &&
                tiles.length > 0 &&
                "lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]",
            )}
          >
            {latestRows.length > 0 ? (
              <div className="min-w-0">
                <SectionHeading
                  id="latest-heading"
                  title={dict.home.latest}
                  href={localePath(locale, "/news")}
                  label={dict.home.viewAll}
                />
                <div className="divide-y divide-border">
                  {latestRows.map((article) => (
                    <div key={article.id} className="py-4 first:pt-1">
                      <ArticleCard
                        article={article}
                        locale={locale}
                        variant="horizontal"
                        thumb="wide"
                      />
                    </div>
                  ))}
                </div>
                <LoadMoreArticles
                  locale={locale}
                  dict={dict}
                  initialPage={1}
                  pageSize={LATEST_PAGE_SIZE}
                  excludeIds={[...used]}
                  initialHasMore={latest.hasMore}
                  variant="horizontal"
                />
              </div>
            ) : null}

            {tiles.length > 0 ? (
              <div>
                <SectionHeading
                  id="categories-heading"
                  title={dict.home.featuredCategories}
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {tiles.map((tile, index) => (
                    <Link
                      key={tile.id}
                      href={localePath(locale, `/${tile.slug}`)}
                      className="gvn-media group relative block aspect-[16/10] bg-gvn-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gvn-red"
                    >
                      <Image
                        src={tile.image || editorialFallback(index)}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                        sizes="(max-width: 768px) 45vw, 220px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gvn-deep-navy/90 via-gvn-navy/30 to-transparent" />
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[2px] bg-gvn-red opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                      <span className="absolute inset-x-0 bottom-0 p-3">
                        <span className="block text-sm font-semibold text-white">
                          {tile.name}
                        </span>
                        <span className="mt-0.5 line-clamp-1 block text-[11px] text-white/75">
                          {tile.description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      <section className="relative isolate overflow-hidden bg-gvn-navy text-white">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={editorial.globe}
            alt=""
            fill
            className="object-cover object-right opacity-90"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gvn-deep-navy via-gvn-navy/95 to-gvn-navy/30" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:gap-10 md:py-14">
          <Image
            src="/brand/gvn-logo-mark.png"
            alt=""
            width={160}
            height={56}
            className="h-14 w-auto shrink-0 md:h-16"
          />
          <div className="max-w-xl">
            <span aria-hidden className="mb-3 block h-0.5 w-10 bg-gvn-red" />
            <h2 className="font-serif text-2xl font-semibold leading-tight md:text-3xl">
              {dict.home.promoTitle}
            </h2>
            <p className="mt-2 text-sm text-white/80 md:text-base">
              {locale === "en" && settings.tagline
                ? settings.tagline
                : dict.home.promoText}
            </p>
            <a
              href="#newsletter"
              className="mt-6 inline-flex h-11 items-center justify-center bg-gvn-red px-6 text-sm font-semibold text-white transition-colors hover:bg-[#c92f3b] focus-visible:!outline-white"
            >
              {dict.home.promoCta}
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <Suspense fallback={null}>
          <HomeMediaSection locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
