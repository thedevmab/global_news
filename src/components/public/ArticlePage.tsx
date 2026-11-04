import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArticleBody } from "@/components/article/ArticleBody";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ShareButtons } from "@/components/article/ShareButtons";
import { ViewTracker } from "@/components/article/ViewTracker";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { AdSlot } from "@/components/media/AdSlot";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { editorial } from "@/lib/editorial-images";
import { mediaUrl } from "@/lib/media-url";
import { buildNewsArticleJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/utils";
import {
  getPublishedArticleBySlug,
  getRelatedArticles,
} from "@/server/articles/public";

export async function ArticlePageView({
  locale,
  categorySlug,
  slug,
}: {
  locale: Locale;
  categorySlug: string;
  slug: string;
}) {
  const dict = getDictionary(locale);
  const article = await getPublishedArticleBySlug(categorySlug, slug, locale);
  if (!article) notFound();

  const related = await getRelatedArticles({
    id: article.id,
    categoryId: article.categoryId,
    language: article.language,
    tags: article.tags.map((t) => ({ tagId: t.tagId })),
  });

  const image = mediaUrl(article.featuredMedia?.storageKey);
  const author = article.authorProfile?.displayName || article.author.name;
  const categoryName =
    locale === "am" && article.category.nameAm
      ? article.category.nameAm
      : article.category.nameEn;
  const path = `/${article.category.slug}/${article.slug}`;
  const pageUrl = absoluteUrl(localePath(locale, path));
  const dek = article.subheadline || article.summary;
  const caption = [
    article.featuredMedia?.caption,
    article.featuredMedia?.credit,
  ]
    .filter(Boolean)
    .join(" — ");

  const jsonLd = buildNewsArticleJsonLd({
    headline: article.headline,
    description: article.summary,
    datePublished:
      article.publishedAt?.toISOString() || article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    authorName: author,
    imageUrl: image ? absoluteUrl(image) : undefined,
    url: pageUrl,
  });

  return (
    <article className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker articleId={article.id} />

      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={localePath(locale, "/")} className="hover:text-gvn-red">
              {dict.nav.home}
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link
              href={localePath(locale, `/${article.category.slug}`)}
              className="hover:text-gvn-red"
            >
              {categoryName}
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li className="line-clamp-1 min-w-0 text-foreground/70">
            {article.headline}
          </li>
        </ol>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gvn-red">
            <Link href={localePath(locale, `/${article.category.slug}`)}>
              {categoryName}
            </Link>
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-[1.15] text-foreground md:text-5xl">
            {article.headline}
          </h1>
          {dek ? (
            <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
              {dek}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>
              {dict.article.by}{" "}
              {article.authorProfile ? (
                <Link
                  href={localePath(
                    locale,
                    `/author/${article.authorProfile.username}`,
                  )}
                  className="font-medium text-foreground hover:text-gvn-red"
                >
                  {author}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{author}</span>
              )}
            </span>
            {article.publishedAt ? (
              <>
                <span aria-hidden>·</span>
                <time dateTime={article.publishedAt.toISOString()}>
                  {format(article.publishedAt, "MMM d, yyyy")}
                </time>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span>
              {article.readingTimeMinutes} {dict.article.minRead}
            </span>
          </div>

          <div className="mt-4">
            <ShareButtons url={pageUrl} title={article.headline} dict={dict} />
          </div>

          <figure className="mt-6">
            <div className="relative aspect-[16/9] overflow-hidden bg-gvn-navy">
              <Image
                src={image || editorial.skyline}
                alt={image ? article.featuredMedia?.altText || article.headline : ""}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 860px"
                priority
              />
            </div>
            <figcaption className="mt-2 text-xs text-muted-foreground">
              {caption || dict.article.photoCredit}
            </figcaption>
          </figure>

          <div className="prose-article mt-8 max-w-[68ch]">
            <ArticleBody body={article.body} />
          </div>
          <AdSlot slotKey="IN_ARTICLE" className="my-8 max-w-[68ch]" />

          {article.tags.length > 0 ? (
            <ul className="mt-8 flex max-w-[68ch] flex-wrap gap-2">
              {article.tags.map(({ tag }) => (
                <li key={tag.id}>
                  <Link
                    href={localePath(locale, `/tag/${tag.slug}`)}
                    className="inline-flex rounded-full bg-[#F3F5F8] px-3 py-1 text-xs text-[#718096] hover:text-foreground dark:bg-white/10 dark:text-white/70"
                  >
                    #{tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20">
          {related.length > 0 ? (
            <section aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-sm font-bold">
                {dict.article.related}
              </h2>
              <ul className="mt-3 space-y-4">
                {related.map((item) => (
                  <li key={item.id}>
                    <ArticleCard
                      article={item}
                      locale={locale}
                      variant="compact"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section
            aria-labelledby="stay-updated"
            className="rounded-md border border-border bg-card p-4 shadow-sm"
          >
            <h2 id="stay-updated" className="text-sm font-bold">
              {dict.home.stayUpdated}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {dict.newsletter.title}
            </p>
            <div className="mt-3">
              <NewsletterForm dict={dict} variant="stacked" />
            </div>
          </section>

          <AdSlot slotKey="SIDEBAR" />
        </aside>
      </div>
    </article>
  );
}
