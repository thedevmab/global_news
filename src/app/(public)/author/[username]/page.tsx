import { notFound } from "next/navigation";
import Image from "next/image";
import { listByAuthor } from "@/server/articles/public";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { username } = await params;
  const sp = await searchParams;
  const data = await listByAuthor(username, {
    page: Number(sp.page || "1"),
  });
  if (!data) notFound();
  const photoKey = data.author.photo?.storageKey;
  const social = (data.author.socialLinks || {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted">
          {photoKey ? (
            <Image
              src={`/media/${photoKey}`}
              alt={data.author.displayName}
              fill
              className="object-cover"
            />
          ) : null}
        </div>
        <div>
          <h1 className="font-serif text-4xl font-bold">
            {data.author.displayName}
          </h1>
          <p className="text-muted-foreground">@{data.author.username}</p>
          {data.author.bio ? (
            <p className="mt-2 max-w-2xl text-sm">{data.author.bio}</p>
          ) : null}
          <div className="mt-2 flex gap-3 text-sm">
            {Object.entries(social)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <a
                  key={k}
                  href={v}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gvn-red hover:underline"
                >
                  {k}
                </a>
              ))}
          </div>
        </div>
      </header>
      {data.items.length === 0 ? (
        <EmptyState title="No published articles" />
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
            hrefForPage={(p) => `/author/${username}?page=${p}`}
          />
        </>
      )}
    </div>
  );
}
