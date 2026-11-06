"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { localePath, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

export type RecentHeadline = {
  id: string;
  headline: string;
  slug: string;
  categorySlug: string;
  language?: string;
};

export function RecentNewsTicker({
  items,
  locale,
  label,
}: {
  items: RecentHeadline[];
  locale: Locale;
  label: string;
}) {
  const [paused, setPaused] = useState(false);

  const safeItems = useMemo(
    () => items.filter((item) => item.headline.trim().length > 0),
    [items],
  );

  const track = useMemo(() => {
    if (safeItems.length === 0) return [];
    const copies = safeItems.length === 1 ? 4 : 2;
    return Array.from({ length: copies }, () => safeItems).flat();
  }, [safeItems]);

  if (safeItems.length === 0) return null;

  const durationSec = Math.max(24, safeItems.length * 8);

  return (
    <div
      className="border-b border-gvn-red/40 bg-chrome text-chrome-foreground"
      role="region"
      aria-label={label}
    >
      <div className="mx-auto flex h-10 max-w-7xl items-center gap-3 px-4">
        <span className="inline-flex shrink-0 items-center rounded-sm bg-gvn-red px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          {label}
        </span>
        <div
          className="relative min-w-0 flex-1 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <ul
            className={cn(
              "flex w-max items-center whitespace-nowrap text-sm font-medium",
              !paused && "animate-gvn-ticker",
            )}
            style={{ animationDuration: `${durationSec}s` }}
          >
            {track.map((item, idx) => (
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
      </div>
    </div>
  );
}
