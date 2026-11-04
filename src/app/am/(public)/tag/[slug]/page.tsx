import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article/ArticleCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getDictionary, localePath } from "@/i18n";
import { listByTag } from "@/server/articles/public";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `መለያ: ${slug}` };
}

export default async function Page({ params, searchParams }: Props) {
  const locale = "am" as const;
  const dict = getDictionary(locale);
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const result = await listByTag({
    tagSlug: slug,
    page,
    pageSize: 12,
    language: locale,
  });
  if (!result) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl font-semibold">
        #{result.tag.name}
      </h1>
      {result.items.length === 0 ? (
        <EmptyState
          title={dict.search.noResults}
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
                p <= 1 ? `/tag/${slug}` : `/tag/${slug}?page=${p}`,
              )
            }
          />
        </>
      )}
    </div>
  );
}
