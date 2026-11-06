"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function LanguageSwitch({ locale }: { locale: "en" | "am" }) {
  const pathname = usePathname() || "/";
  const withoutLocale = pathname.startsWith("/am")
    ? pathname.replace(/^\/am/, "") || "/"
    : pathname;
  const enHref = withoutLocale;
  const amHref = withoutLocale === "/" ? "/am" : `/am${withoutLocale}`;

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
      <Link
        href={enHref}
        hrefLang="en"
        className={cn(
          "px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          locale === "en"
            ? "text-chrome-foreground"
            : "text-chrome-foreground/45 hover:text-chrome-foreground",
        )}
        aria-current={locale === "en" ? "true" : undefined}
      >
        EN
      </Link>
      <span aria-hidden className="text-chrome-foreground/30">
        |
      </span>
      <Link
        href={amHref}
        hrefLang="am"
        className={cn(
          "px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          locale === "am"
            ? "text-chrome-foreground"
            : "text-chrome-foreground/45 hover:text-chrome-foreground",
        )}
        aria-current={locale === "am" ? "true" : undefined}
      >
        አማ
      </Link>
    </div>
  );
}
