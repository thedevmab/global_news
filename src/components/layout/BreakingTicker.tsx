"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { localePath, type Locale } from "@/i18n";
import type { Dictionary } from "@/i18n/en";
import { cn } from "@/lib/utils";

export type BreakingItem = {
  id: string;
  headline: string;
  slug: string;
  categorySlug: string;
  language?: string;
};

export function BreakingTicker({
  items,
  locale,
  dict,
}: {
  items: BreakingItem[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [paused, setPaused] = useState(false);

  const doubled = useMemo(() => {
    if (items.length === 0) return [];
    return [...items, ...items];
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div
      className="border-b border-chrome-border bg-chrome text-chrome-foreground"
      role="region"
      aria-label={dict.home.breaking}
    >
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 px-4">
        <span className="inline-flex shrink-0 items-center rounded-full bg-gvn-red px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          {dict.home.breaking}
        </span>
        <div
          className="relative min-w-0 flex-1 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <ul
            className={cn(
              "flex w-max items-center whitespace-nowrap text-[13px]",
              !paused && "animate-gvn-ticker",
            )}
          >
            {doubled.map((item, idx) => (
              <li key={`${item.id}-${idx}`} className="flex items-center">
                <Link
                  href={localePath(
                    item.language === "am" ? "am" : locale,
                    `/${item.categorySlug}/${item.slug}`,
                  )}
                  className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.headline}
                </Link>
                <span aria-hidden className="px-4 text-chrome-foreground/35">
                  •
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-chrome-foreground/80 hover:bg-chrome-muted hover:text-chrome-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-pressed={paused}
          aria-label={paused ? "Resume breaking news" : "Pause breaking news"}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? (
            <Play className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Pause className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
