"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { localePath, type Locale } from "@/i18n";
import { getDictionary } from "@/i18n";
import type { NavCategory } from "@/components/layout/Header";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeToggle } from "./ThemeToggle";

export function MobileNav({
  locale,
  categories,
}: {
  locale: Locale;
  categories: NavCategory[];
}) {
  const [open, setOpen] = useState(false);
  const dict = getDictionary(locale);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 focus-visible:!outline-white"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(100%,18rem)] flex-col bg-gvn-deep-navy p-4 text-white shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">{dict.siteName}</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              <Link
                href={localePath(locale, "/")}
                className="rounded px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {dict.nav.home}
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={localePath(locale, `/${c.slug}`)}
                  className="rounded px-3 py-2 text-sm hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {locale === "am" && c.nameAm ? c.nameAm : c.nameEn}
                </Link>
              ))}
              <Link
                href={localePath(locale, "/about")}
                className="rounded px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {dict.nav.about}
              </Link>
              <Link
                href={localePath(locale, "/contact")}
                className="rounded px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {dict.nav.contact}
              </Link>
              <Link
                href={localePath(locale, "/calendar")}
                className="rounded px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {dict.nav.calendar}
              </Link>
              <Link
                href={localePath(locale, "/videos")}
                className="rounded px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {dict.nav.videos}
              </Link>
              <Link
                href={localePath(locale, "/podcasts")}
                className="rounded px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {dict.nav.podcasts}
              </Link>
              <Link
                href={localePath(locale, "/search")}
                className="rounded px-3 py-2 text-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {dict.nav.search}
              </Link>
            </nav>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <LanguageSwitch locale={locale} />
              <ThemeToggle />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
