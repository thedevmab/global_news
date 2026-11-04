import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { editorial } from "@/lib/editorial-images";
import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import type { ArticleCardData } from "@/server/articles/public";

export type { ArticleCardData };

function authorName(article: ArticleCardData) {
  return article.authorProfile?.displayName || article.author.name;
}

function categoryName(
  locale: Locale,
  category: ArticleCardData["category"],
) {
  return locale === "am" && category.nameAm
    ? category.nameAm
    : category.nameEn;
}

function dateLabel(article: ArticleCardData) {
  return article.publishedAt ? format(article.publishedAt, "MMM d, yyyy") : null;
}

export function ArticleCard({
  article,
  locale,
  variant = "default",
  thumb = "square",
  className,
}: {
  article: ArticleCardData;
  locale: Locale;
  variant?: "default" | "lead" | "compact" | "horizontal";
  thumb?: "square" | "wide";
  className?: string;
}) {
  const dict = getDictionary(locale);
  const href = localePath(locale, `/${article.category.slug}/${article.slug}`);
  const image = mediaUrl(article.featuredMedia?.storageKey);
  const alt = article.featuredMedia?.altText || article.headline;
  const when = dateLabel(article);
  const cat = categoryName(locale, article.category);
  const catHref = localePath(locale, `/${article.category.slug}`);

  if (variant === "lead") {
    return (
      <article className={cn("group relative h-full min-h-[340px]", className)}>
        <Link href={href} className="block h-full min-h-[340px] lg:min-h-[460px]">
          <div className="relative h-full min-h-[340px] overflow-hidden bg-gvn-navy lg:min-h-[460px]">
            <Image
              src={image || editorial.skyline}
              alt={image ? alt : ""}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 62vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
              <Badge variant="accent" className="mb-3">
                {cat}
              </Badge>
              <h2 className="line-clamp-4 font-serif text-[1.7rem] font-semibold leading-[1.15] md:text-4xl">
                {article.headline}
              </h2>
              {article.summary ? (
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/90 md:text-base">
                  {article.summary}
                </p>
              ) : null}
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/80 md:text-sm">
                <span>
                  {dict.article.by} {authorName(article)}
                </span>
                {when ? (
                  <>
                    <span aria-hidden>·</span>
                    <time dateTime={article.publishedAt?.toISOString()}>
                      {when}
                    </time>
                  </>
                ) : null}
                <span aria-hidden>·</span>
                <span>
                  {article.readingTimeMinutes} {dict.article.minRead}
                </span>
              </p>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className={cn("group flex w-full gap-3", className)}>
        <Link
          href={href}
          className={cn(
            "relative shrink-0 overflow-hidden bg-gvn-navy",
            thumb === "wide" ? "h-[68px] w-[104px]" : "size-[72px]",
          )}
        >
          <Image
            src={image || editorial.city}
            alt={image ? alt : ""}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="120px"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={catHref}
            className="text-[11px] font-bold uppercase tracking-wide text-gvn-red"
          >
            {cat}
          </Link>
          <h3 className="mt-0.5 text-[15px] font-semibold leading-snug">
            <Link href={href} className="line-clamp-2 hover:text-gvn-red">
              {article.headline}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            {when ? (
              <time dateTime={article.publishedAt?.toISOString()}>{when}</time>
            ) : null}
            {when ? <span aria-hidden>·</span> : null}
            <span>
              {article.readingTimeMinutes} {dict.article.minRead}
            </span>
          </p>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={cn("group flex gap-3", className)}>
        <Link
          href={href}
          className="relative size-16 shrink-0 overflow-hidden bg-gvn-navy"
        >
          <Image
            src={image || editorial.skyline}
            alt={image ? alt : ""}
            fill
            className="object-cover"
            sizes="64px"
          />
        </Link>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug">
            <Link href={href} className="line-clamp-2 hover:text-gvn-red">
              {article.headline}
            </Link>
          </h3>
          {when ? (
            <time
              dateTime={article.publishedAt?.toISOString()}
              className="mt-1 block text-xs text-muted-foreground"
            >
              {when}
            </time>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col", className)}>
      <Link
        href={href}
        className="relative mb-3 aspect-[16/10] overflow-hidden bg-gvn-navy"
      >
        <Image
          src={image || editorial.skyline}
          alt={image ? alt : ""}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>
      <Link
        href={catHref}
        className="text-xs font-semibold uppercase tracking-wide text-gvn-red"
      >
        {cat}
      </Link>
      <h3 className="mt-1 font-serif text-xl font-semibold leading-snug">
        <Link href={href} className="hover:text-gvn-red">
          {article.headline}
        </Link>
      </h3>
      {article.summary ? (
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
          {article.summary}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{authorName(article)}</span>
        {when ? (
          <>
            <span aria-hidden>·</span>
            <time dateTime={article.publishedAt?.toISOString()}>{when}</time>
          </>
        ) : null}
        <span aria-hidden>·</span>
        <span>
          {article.readingTimeMinutes} {dict.article.minRead}
        </span>
      </div>
    </article>
  );
}
