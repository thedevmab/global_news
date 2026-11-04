import { notFound } from "next/navigation";
import { listByTag } from "@/server/articles/public";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const data = await listByTag(slug, { page: Number(sp.page || "1") });
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 font-serif text-4xl font-bold">#{data.tag.name}</h1>
      {data.items.length === 0 ? (
        <EmptyState
          title="No articles"
          description="No published stories use this tag yet."
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((a) => (
              <ArticleCard key={a.id} article={a} locale="en" />
            ))}
          </div>
          <Pagination
            className="mt-10"
            page={data.page}
            totalPages={data.totalPages}
            hrefForPage={(p) => `/tag/${slug}?page=${p}`}
          />
        </>
      )}
    </div>
  );
}
