import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  hrefForPage,
  className,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-center gap-3",
        className,
      )}
    >
      {prev ? (
        <Link
          href={hrefForPage(prev)}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Previous
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm opacity-40">
          Previous
        </span>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {next ? (
        <Link
          href={hrefForPage(next)}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Next
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm opacity-40">
          Next
        </span>
      )}
    </nav>
  );
}
