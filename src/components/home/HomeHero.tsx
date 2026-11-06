import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { editorial } from "@/lib/editorial-images";
import { mediaUrl } from "@/lib/media-url";
import type { ArticleCardData } from "@/server/articles/public";

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

export function HomeHero({
  article,
  locale,
}: {
  article: ArticleCardData;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const href = localePath(locale, `/${article.category.slug}/${article.slug}`);
  const catHref = localePath(locale, `/${article.category.slug}`);
  const image = mediaUrl(article.featuredMedia?.storageKey);
  const alt = article.featuredMedia?.altText || article.headline;
  const when = article.publishedAt
    ? format(article.publishedAt, "MMM d, yyyy")
    : null;
  const cat = categoryName(locale, article.category);

  return (
    <section
      aria-label="Featured"
      className="group/hero relative isolate min-h-[min(78vh,720px)] overflow-hidden bg-gvn-deep-navy text-white"
    >
      <div className="absolute inset-0">
        <Image
          src={image || editorial.skyline}
          alt={image ? alt : ""}
          fill
          priority
          className="object-cover object-center gvn-hero-kenburns"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-gvn-deep-navy via-gvn-navy/75 to-gvn-navy/25"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-gvn-deep-navy/90 via-gvn-deep-navy/35 to-transparent"
        />
      </div>

      <div className="relative mx-auto flex min-h-[min(78vh,720px)] max-w-7xl flex-col justify-end px-4 pb-10 pt-24 md:pb-14 md:pt-28">
        <div className="gvn-hero-copy max-w-3xl">
          <div className="mb-5 flex items-center gap-3">
            <Image
              src="/brand/gvn-logo-mark.png"
              alt=""
              width={56}
              height={56}
              className="h-10 w-10 object-contain md:h-12 md:w-12"
              priority
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
                GVN
              </p>
              <p className="text-xs text-white/65">{dict.siteName}</p>
            </div>
          </div>

          <Link
            href={catHref}
            className="text-xs font-bold uppercase tracking-[0.18em] text-gvn-red hover:text-white"
          >
            {cat}
          </Link>

          <h2 className="mt-3 font-serif text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            <Link href={href} className="hover:underline hover:decoration-gvn-red hover:underline-offset-4">
              {article.headline}
            </Link>
          </h2>

          {article.summary ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
              {article.summary}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href={href}
              className="group/cta inline-flex items-center gap-2 border-b-2 border-gvn-red pb-0.5 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              {dict.home.readStory}
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover/cta:translate-x-1"
              >
                →
              </span>
            </Link>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-white/70 md:text-sm">
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
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[3px] bg-gvn-red"
      />
    </section>
  );
}
