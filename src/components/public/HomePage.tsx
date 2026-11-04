import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Play } from "lucide-react";
import { ArticleCard } from "@/components/article/ArticleCard";
import { LoadMoreArticles } from "@/components/home/LoadMoreArticles";
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
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-xs font-medium text-muted-foreground hover:text-gvn-red"
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
    sections,
    videos,
    channelVideos,
    podcasts,
    settingsRow,
    categories,
  ] = await Promise.all([
    getHomepageLeadAndSecondary(locale),
    listLatestArticles({ page: 1, pageSize: LATEST_PAGE_SIZE, language: locale }),
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
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-6 md:py-8">
        <AdSlot slotKey="HEADER" />

        {heroLead ? (
          <section
            aria-label="Featured"
            className={cn(
              "grid items-start gap-6",
              heroRail.length > 0 &&
                "lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]",
            )}
          >
            <ArticleCard article={heroLead} locale={locale} variant="lead" />
            {heroRail.length > 0 ? (
              <div className="flex w-full flex-col justify-start">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {dict.home.topStories}
                </p>
                <div className="divide-y divide-border border-y border-border">
                  {heroRail.map((article) => (
                    <div key={article.id} className="py-3.5">
                      <ArticleCard
                        article={article}
                        locale={locale}
                        variant="horizontal"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {latestRows.length > 0 || tiles.length > 0 ? (
          <section
            className={cn(
              "grid items-start gap-10",
              latestRows.length > 0 &&
                tiles.length > 0 &&
                "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]",
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
                <div className="divide-y divide-border border-y border-border">
                  {latestRows.map((article) => (
                    <div key={article.id} className="py-4">
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
                      className="group relative block aspect-[16/10] overflow-hidden bg-gvn-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gvn-red"
                    >
                      <Image
                        src={tile.image || editorialFallback(index)}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        sizes="(max-width: 768px) 45vw, 220px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
                      {!tile.image && tile.color ? (
                        <span
                          aria-hidden
                          className="absolute inset-x-0 top-0 h-1"
                          style={{ backgroundColor: tile.color }}
                        />
                      ) : null}
                      <span className="absolute inset-x-0 bottom-0 p-3">
                        <span className="block text-sm font-semibold text-white">
                          {tile.name}
                        </span>
                        <span className="mt-0.5 line-clamp-1 block text-[11px] text-white/80">
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
            className="object-cover object-right"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gvn-navy via-gvn-navy/92 to-gvn-navy/25" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center md:py-12">
          <Image
            src="/brand/gvn-logo-mark.png"
            alt=""
            width={144}
            height={51}
            className="h-14 w-auto shrink-0"
          />
          <div className="max-w-xl">
            <h2 className="font-serif text-2xl font-semibold leading-tight md:text-3xl">
              {dict.home.promoTitle}
            </h2>
            <p className="mt-2 text-sm text-white/80">
              {locale === "en" && settings.tagline
                ? settings.tagline
                : dict.home.promoText}
            </p>
            <a
              href="#newsletter"
              className="mt-5 inline-flex h-10 items-center justify-center bg-gvn-red px-5 text-sm font-semibold text-white hover:bg-red-600 focus-visible:!outline-white"
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
            className="scroll-mt-24 flex w-full flex-col gap-6 rounded-md border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between md:gap-10 md:p-8"
          >
            <div className="max-w-md">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
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
            "grid items-start gap-8",
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
                <span className="relative block aspect-video overflow-hidden bg-gvn-navy">
                  <Image
                    src={channelVideo ? channelVideo.thumbnailUrl : editorial.city}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 360px"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-gvn-navy shadow-sm">
                    <Play className="h-4 w-4 fill-current" aria-hidden />
                  </span>
                </span>
                <span className="mt-3 block text-sm font-semibold leading-snug group-hover:text-gvn-red">
                  {channelVideo ? channelVideo.title : archiveVideo!.title}
                </span>
                {(channelVideo?.publishedAt || archiveVideo?.publishedAt) ? (
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
              <ul className="divide-y divide-border rounded-md border border-border bg-card">
                {podcasts.items.map((podcast) => (
                  <li key={podcast.id}>
                    <Link
                      href={localePath(locale, `/podcasts/${podcast.slug}`)}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-muted/70"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-gvn-navy dark:text-white">
                        <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
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
            className="scroll-mt-24 rounded-md border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="text-base font-bold tracking-tight text-foreground">
              {dict.home.newsletterCardTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {dict.home.newsletterCardText}
            </p>
            <div className="mt-4">
              <NewsletterForm dict={dict} variant="stacked" />
            </div>
          </div>
        </section>
        )}

        <div className="mt-10">
          <AdSlot slotKey="FOOTER" />
        </div>
      </div>
    </div>
  );
}
