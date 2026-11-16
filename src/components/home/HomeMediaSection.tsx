import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Play } from "lucide-react";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { getChannelVideos } from "@/lib/youtube";
import { editorial } from "@/lib/editorial-images";
import { cn } from "@/lib/utils";
import {
  listPublishedPodcasts,
  listPublishedVideos,
} from "@/server/articles/public";

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

export async function HomeMediaSection({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [videos, channelVideos, podcasts] = await Promise.all([
    listPublishedVideos({ page: 1, pageSize: 1, language: locale }),
    getChannelVideos().catch(() => []),
    listPublishedPodcasts({ page: 1, pageSize: 3, language: locale }),
  ]);

  const channelVideo = channelVideos[0] ?? null;
  const archiveVideo = videos.items[0] ?? null;
  const mediaColumns =
    (channelVideo || archiveVideo ? 1 : 0) +
    (podcasts.items.length > 0 ? 1 : 0);

  if (mediaColumns === 0) {
    return (
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
    );
  }

  return (
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
                src={channelVideo ? channelVideo.thumbnailUrl : editorial.city}
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
          <NewsletterForm dict={dict} variant="stacked" tone="onChrome" />
        </div>
      </div>
    </section>
  );
}
