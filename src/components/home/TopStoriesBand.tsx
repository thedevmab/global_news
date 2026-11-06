import Image from "next/image";
import Link from "next/link";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { editorial } from "@/lib/editorial-images";
import { mediaUrl } from "@/lib/media-url";
import type { ArticleCardData } from "@/server/articles/public";

function categoryName(
  locale: Locale,
  category: ArticleCardData["category"],
) {
  return locale === "am" && category.nameAm
    ? category.nameAm
    : category.nameEn;
}

export function TopStoriesBand({
  articles,
  locale,
}: {
  articles: ArticleCardData[];
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="top-stories-heading"
      className="border-b border-chrome-border bg-chrome text-chrome-foreground"
    >
      <div className="h-[2px] bg-gvn-red" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-7">
        <p
          id="top-stories-heading"
          className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-chrome-foreground/55"
        >
          {dict.home.topStories}
        </p>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {articles.map((article, index) => {
            const href = localePath(
              locale,
              `/${article.category.slug}/${article.slug}`,
            );
            const catHref = localePath(locale, `/${article.category.slug}`);
            const image = mediaUrl(article.featuredMedia?.storageKey);
            const alt = article.featuredMedia?.altText || article.headline;
            const cat = categoryName(locale, article.category);

            return (
              <li key={article.id} className="group flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 font-serif text-2xl font-semibold tabular-nums leading-none text-gvn-red/90"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={href}
                    className="relative mb-2.5 block aspect-[16/10] overflow-hidden bg-gvn-navy"
                  >
                    <Image
                      src={image || editorial.city}
                      alt={image ? alt : ""}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      sizes="(max-width: 640px) 90vw, 240px"
                    />
                  </Link>
                  <Link
                    href={catHref}
                    className="text-[10px] font-bold uppercase tracking-[0.16em] text-gvn-red"
                  >
                    {cat}
                  </Link>
                  <h3 className="mt-1 text-sm font-semibold leading-snug text-chrome-foreground md:text-[15px]">
                    <Link
                      href={href}
                      className="line-clamp-3 transition-colors hover:text-gvn-red"
                    >
                      {article.headline}
                    </Link>
                  </h3>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
