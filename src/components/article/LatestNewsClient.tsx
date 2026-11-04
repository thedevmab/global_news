"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n";
import type { ArticleCardData } from "@/server/articles/public";

type Serialized = Omit<ArticleCardData, "publishedAt"> & {
  publishedAt: string | null;
};

function revive(article: Serialized | ArticleCardData): ArticleCardData {
  return {
    ...article,
    publishedAt: article.publishedAt
      ? new Date(article.publishedAt as string | Date)
      : null,
  };
}

export function LatestNewsClient({
  initial,
  initialPage,
  totalPages,
  locale,
}: {
  initial: ArticleCardData[] | Serialized[];
  initialPage: number;
  totalPages: number;
  locale: Locale;
}) {
  const [items, setItems] = useState(() => initial.map(revive));
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/articles/latest?page=${page + 1}&pageSize=12&language=${locale}`,
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { items: Serialized[] };
      setItems((prev) => [...prev, ...data.items.map(revive)]);
      setPage((p) => p + 1);
    } catch {
      setError("Unable to load more articles.");
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <p className="text-muted-foreground">No published articles yet.</p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <ArticleCard key={a.id} article={a} locale={locale} />
        ))}
      </div>
      {page < totalPages ? (
        <div className="flex flex-col items-center gap-2">
          <Button onClick={loadMore} disabled={loading} variant="outline">
            {loading ? "Loading…" : "Load more"}
          </Button>
          {error ? (
            <p className="text-sm text-gvn-red" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
