"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { localePath, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

export function HeaderSearch({
  locale,
  placeholder,
  label,
}: {
  locale: Locale;
  placeholder: string;
  label: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: MouseEvent | PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    const href = query
      ? localePath(locale, `/search?q=${encodeURIComponent(query)}`)
      : localePath(locale, "/search");
    router.push(href);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative flex items-center">
      {!open ? (
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-chrome-foreground/90 hover:bg-chrome-muted hover:text-chrome-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={label}
          aria-expanded={false}
          aria-controls={inputId}
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4" />
        </button>
      ) : (
        <form
          onSubmit={submit}
          className={cn(
            "flex h-9 items-center overflow-hidden rounded-md border border-chrome-border/60 bg-chrome-muted/40 focus-within:ring-2 focus-within:ring-ring",
            "absolute right-0 top-1/2 z-50 w-[min(18rem,calc(100vw-2rem))] -translate-y-1/2 shadow-lg lg:static lg:w-56 lg:translate-y-0 lg:shadow-none xl:w-64",
          )}
          role="search"
        >
          <label className="sr-only" htmlFor={inputId}>
            {label}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm text-chrome-foreground placeholder:text-chrome-foreground/50 outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-chrome-foreground/90 hover:text-chrome-foreground"
            aria-label={label}
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-chrome-foreground/70 hover:text-chrome-foreground lg:hidden"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
