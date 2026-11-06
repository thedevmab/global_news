import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Play } from "lucide-react";
import { ArticleCard } from "@/components/article/ArticleCard";
import { HomeHero } from "@/components/home/HomeHero";
import { LoadMoreArticles } from "@/components/home/LoadMoreArticles";
import { RecentNewsTicker } from "@/components/home/RecentNewsTicker";
import { TopStoriesBand } from "@/components/home/TopStoriesBand";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { AdSlot } from "@/components/media/AdSlot";
import { EmptyState } from "@/components/ui/empty-state";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { categoryBlurb } from "@/lib/category-blurb";
import { getChannelVideos } from "@/lib/youtube";
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
  listPublishedPodcasts,
  listPublishedVideos,
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
  label: string;
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
      {href ? (
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
    videos,
    channelVideos,
    podcasts,
    settingsRow,
    categories,
  ] = await Promise.all([
    // Homepage surfaces all published languages so Amharic/English posts from
    // the dashboard both appear on / and /am (category pages stay locale-scoped).
    getHomepageLeadAndSecondary(),
    listLatestArticles({ page: 1, pageSize: LATEST_PAGE_SIZE }),
    listRecentHeadlines({ hours: 12, limit: 20 }),
    getHomepageCategorySections(locale, 1),
    listPublishedVideos({ page: 1, pageSize: 1, language: locale }),
    getChannelVideos().catch(() => []),
    listPublishedPodcasts({ page: 1, pageSize: 3, language: locale }),
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
  const channelVideo = channelVideos[0] ?? null;
  const archiveVideo = videos.items[0] ?? null;
  const hasMedia =
    Boolean(channelVideo || archiveVideo) || podcasts.items.length > 0;

  if (!hasArticles && !hasMedia) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="sr-only">{dict.siteName}</h1>
        <EmptyState
          title={dict.home.emptyTitle}
          description={dict.home.emptyDescription}
          className="border-solid border-gvn-navy/10 bg-card shadow-sm"
        />
      </div>
    );
  }

  const mediaColumns =
    (channelVideo || archiveVideo ? 1 : 0) +
    (podcasts.items.length > 0 ? 1 : 0);

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
          categorySlug: article.category.slug,
        }))}
      />

      {heroLead ? <HomeHero article={heroLead} locale={locale} /> : null}
      {heroRail.length > 0 ? (
        <TopStoriesBand articles={heroRail} locale={locale} />
      ) : null}

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 md:py-10">
        <AdSlot slotKey="MIDDLE" />

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
                  href={localePath(locale, "/search")}
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
                  href="#footer-categories"
                  label={dict.home.viewAll}
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
        {mediaColumns === 0 ? (
          <section
            id="newsletter"
            className="scroll-mt-24 flex w-full flex-col gap-6 border border-border bg-gvn-light-gray/60 p-6 dark:bg-muted/40 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8"
          >
            <div className="max-w-md">
              <span aria-hidden className="mb-2 block h-0.5 w-8 bg-gvn-red" />
              <h2 className="text-xl font-bold tracking-tight text-gvn-navy dark:text-white">
                {dict.home.newsletterCardTitle}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {dict.home.newsletterCardText}
              </p>
            </div>
            <div className="w-full min-w-0 md:max-w-sm md:shrink-0">
              <NewsletterForm dict={dict} variant="inline" />
            </div>
          </section>
        ) : (
          <section
            className={cn(
              "grid items-start gap-8 md:gap-10",
              mediaColumns === 2 && "lg:grid-cols-3",
              mediaColumns === 1 && "lg:grid-cols-2",
            )}
          >
            {channelVideo || archiveVideo ? (
              <div>
                <SectionHeading
                  id="videos-heading"
                  title={dict.home.featuredVideos}
                  href={localePath(locale, "/videos")}
                  label={dict.home.viewAll}
                />
                <Link
                  href={localePath(
                    locale,
                    `/videos/${channelVideo ? channelVideo.id : archiveVideo!.slug}`,
                  )}
                  className="group block"
                >
                  <span className="gvn-media relative block aspect-video bg-gvn-navy">
                    <Image
                      src={
                        channelVideo ? channelVideo.thumbnailUrl : editorial.city
                      }
                      alt=""
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      sizes="(max-width: 1024px) 100vw, 360px"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-gvn-deep-navy/55 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gvn-navy">
                      <Play className="h-4 w-4 fill-current" aria-hidden />
                    </span>
                  </span>
                  <span className="mt-3 block text-sm font-semibold leading-snug text-foreground group-hover:text-gvn-red">
                    {channelVideo ? channelVideo.title : archiveVideo!.title}
                  </span>
                  {channelVideo?.publishedAt || archiveVideo?.publishedAt ? (
                    <time
                      dateTime={
                        channelVideo
                          ? channelVideo.publishedAt
                          : archiveVideo!.publishedAt!.toISOString()
                      }
                      className="mt-1 block text-xs text-muted-foreground"
                    >
                      {format(
                        channelVideo
                          ? new Date(channelVideo.publishedAt)
                          : archiveVideo!.publishedAt!,
                        "MMM d, yyyy",
                      )}
                    </time>
                  ) : null}
                </Link>
              </div>
            ) : null}

            {podcasts.items.length > 0 ? (
              <div>
                <SectionHeading
                  id="podcasts-heading"
                  title={dict.home.featuredPodcasts}
                  href={localePath(locale, "/podcasts")}
                  label={dict.home.viewAll}
                />
                <ul className="divide-y divide-border border-y border-border">
                  {podcasts.items.map((podcast) => (
                    <li key={podcast.id}>
                      <Link
                        href={localePath(locale, `/podcasts/${podcast.slug}`)}
                        className="flex items-center gap-3 py-3.5 hover:text-gvn-red"
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-gvn-navy/20 text-gvn-navy dark:border-white/20 dark:text-white">
                          <Play
                            className="h-3.5 w-3.5 fill-current"
                            aria-hidden
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {podcast.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {podcast.episodeNumber != null
                              ? locale === "am"
                                ? `ክፍል ${podcast.episodeNumber}`
                                : `Episode ${podcast.episodeNumber}`
                              : dict.nav.podcasts}
                            {podcast.publishedAt
                              ? ` · ${format(podcast.publishedAt, "MMM d, yyyy")}`
                              : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div
              id="newsletter"
              className="scroll-mt-24 border border-border bg-surface p-5 text-surface-foreground dark:bg-inverse dark:text-inverse-foreground md:p-6"
            >
              <span aria-hidden className="mb-3 block h-0.5 w-8 bg-gvn-red" />
              <h2 className="text-base font-bold tracking-tight text-gvn-navy dark:text-white">
                {dict.home.newsletterCardTitle}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground dark:text-white/75">
                {dict.home.newsletterCardText}
              </p>
              <div className="mt-4">
                <NewsletterForm
                  dict={dict}
                  variant="stacked"
                  tone="onChrome"
                />
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
