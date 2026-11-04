"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n";
import type { Dictionary } from "@/i18n/en";
import type { ArticleCardData } from "@/server/articles/public";

type SerializedArticle = Omit<ArticleCardData, "publishedAt"> & {
  publishedAt: string | null;
};

function revive(article: SerializedArticle): ArticleCardData {
  return {
    ...article,
    publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
  };
}

export function LoadMoreArticles({
  locale,
  dict,
  initialPage,
  excludeIds,
  initialHasMore,
  pageSize = 12,
  variant = "default",
}: {
  locale: Locale;
  dict: Dictionary;
  initialPage: number;
  excludeIds: string[];
  initialHasMore: boolean;
  pageSize?: number;
  variant?: "default" | "horizontal";
}) {
  const [page, setPage] = useState(initialPage);
  const [items, setItems] = useState<ArticleCardData[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const next = page + 1;
      const params = new URLSearchParams({
        page: String(next),
        pageSize: String(pageSize),
        language: locale,
      });
      for (const id of excludeIds) params.append("exclude", id);
      const res = await fetch(`/api/articles/latest?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: SerializedArticle[];
        hasMore: boolean;
      };
      setItems((prev) => [...prev, ...data.items.map(revive)]);
      setHasMore(data.hasMore);
      setPage(next);
    } finally {
      setLoading(false);
    }
  }

  if (!hasMore && items.length === 0) return null;

  return (
    <div id="load-more" className="mt-4 space-y-4">
      {items.length > 0 ? (
        variant === "horizontal" ? (
          <div className="space-y-4">
            {items.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                locale={locale}
                variant="horizontal"
                thumb="wide"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        )
      ) : null}
      {hasMore ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            disabled={loading}
            className="hover:border-gvn-red hover:text-gvn-red"
          >
            {loading ? "…" : dict.home.loadMore}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
