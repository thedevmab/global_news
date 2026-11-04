import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getDictionary, localePath } from "@/i18n";
import { listPublishedPodcasts } from "@/server/articles/public";

export const metadata: Metadata = { title: "ፖድካስት" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function Page({ searchParams }: Props) {
  const locale = "am" as const;
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const result = await listPublishedPodcasts({
    page,
    pageSize: 12,
    language: locale,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl font-semibold">
        {dict.nav.podcasts}
      </h1>
      {result.items.length === 0 ? (
        <EmptyState
          title={dict.home.emptyTitle}
          description={dict.home.emptyDescription}
        />
      ) : (
        <>
          <ul className="divide-y divide-border border-y border-border">
            {result.items.map((p) => (
              <li key={p.id}>
                <Link
                  href={localePath(locale, `/podcasts/${p.slug}`)}
                  className="flex flex-col gap-1 py-5 hover:text-gvn-red sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-serif text-xl font-semibold">
                    {p.title}
                  </span>
                  {p.episodeNumber != null ? (
                    <span className="text-sm text-muted-foreground">
                      Episode {p.episodeNumber}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            className="mt-10"
            page={result.page}
            totalPages={result.totalPages}
            hrefForPage={(p) =>
              localePath(locale, p <= 1 ? "/podcasts" : `/podcasts?page=${p}`)
            }
          />
        </>
      )}
    </div>
  );
}
