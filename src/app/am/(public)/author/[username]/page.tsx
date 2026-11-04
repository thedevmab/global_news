import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article/ArticleCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getDictionary, localePath } from "@/i18n";
import { mediaUrl } from "@/lib/media-url";
import { listByAuthor } from "@/server/articles/public";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}

export default async function Page({ params, searchParams }: Props) {
  const locale = "am" as const;
  const dict = getDictionary(locale);
  const { username } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const result = await listByAuthor({
    username,
    page,
    pageSize: 12,
    language: locale,
  });
  if (!result) notFound();

  const photo = mediaUrl(result.author.photo?.storageKey);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        {photo ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted">
            <Image
              src={photo}
              alt={result.author.displayName}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gvn-navy text-2xl font-semibold text-white">
            {result.author.displayName.slice(0, 1)}
          </div>
        )}
        <div>
          <h1 className="font-serif text-3xl font-semibold">
            {result.author.displayName}
          </h1>
          {result.author.bio ? (
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {result.author.bio}
            </p>
          ) : null}
        </div>
      </header>

      {result.items.length === 0 ? (
        <EmptyState
          title={dict.home.emptyTitle}
          description={dict.home.emptyDescription}
        />
      ) : (
        <>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                locale={locale}
              />
            ))}
          </div>
          <Pagination
            className="mt-10"
            page={result.page}
            totalPages={result.totalPages}
            hrefForPage={(p) =>
              localePath(
                locale,
                p <= 1
                  ? `/author/${username}`
                  : `/author/${username}?page=${p}`,
              )
            }
          />
        </>
      )}
    </div>
  );
}
