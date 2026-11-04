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
          "px-0.5 focus-visible:!outline-white",
          locale === "en" ? "text-white" : "text-white/50 hover:text-white",
        )}
        aria-current={locale === "en" ? "true" : undefined}
      >
        EN
      </Link>
      <span aria-hidden className="text-white/35">
        |
      </span>
      <Link
        href={amHref}
        hrefLang="am"
        className={cn(
          "px-0.5 focus-visible:!outline-white",
          locale === "am" ? "text-white" : "text-white/50 hover:text-white",
        )}
        aria-current={locale === "am" ? "true" : undefined}
      >
        አማ
      </Link>
    </div>
  );
}
