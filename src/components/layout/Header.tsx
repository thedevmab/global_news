import Link from "next/link";
import { Search } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { getActiveCategories } from "@/server/articles/public";
import { LanguageSwitch } from "./LanguageSwitch";
import { MobileNav } from "./MobileNav";
import { PrimaryNav, type NavLinkItem } from "./PrimaryNav";
import { ThemeToggle } from "./ThemeToggle";

export type NavCategory = {
  slug: string;
  nameEn: string;
  nameAm: string | null;
};

function categoryLabel(locale: Locale, cat: NavCategory) {
  return locale === "am" && cat.nameAm ? cat.nameAm : cat.nameEn;
}

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-md text-chrome-foreground/90 hover:bg-chrome-muted hover:text-chrome-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export async function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const categories = await getActiveCategories();
  const navCategories: NavCategory[] = categories.map((c) => ({
    slug: c.slug,
    nameEn: c.nameEn,
    nameAm: c.nameAm,
  }));

  const categoryLinks: NavLinkItem[] = navCategories.map((c) => ({
    href: localePath(locale, `/${c.slug}`),
    label: categoryLabel(locale, c),
  }));
  const primary: NavLinkItem[] = [
    ...categoryLinks.slice(0, 6),
    { href: localePath(locale, "/about"), label: dict.nav.about },
    { href: localePath(locale, "/contact"), label: dict.nav.contact },
  ];
  const moreItems: NavLinkItem[] = [
    ...categoryLinks.slice(6),
    { href: localePath(locale, "/calendar"), label: dict.nav.calendar },
    { href: localePath(locale, "/videos"), label: dict.nav.videos },
    { href: localePath(locale, "/podcasts"), label: dict.nav.podcasts },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-chrome-border bg-chrome text-chrome-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link
          href={localePath(locale, "/")}
          className="relative flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={dict.siteName}
        >
          <BrandLogo priority imageClassName="h-8 w-auto" />
        </Link>

        <PrimaryNav
          home={{ href: localePath(locale, "/"), label: dict.nav.home }}
          links={primary}
          moreLabel={dict.nav.more}
          moreItems={moreItems}
        />

        <div className="ml-auto flex items-center gap-1">
          <Link
            href={localePath(locale, "/search")}
            className={iconBtn}
            aria-label={dict.nav.search}
          >
            <Search className="h-4 w-4" />
          </Link>
          <div className="hidden items-center gap-2 pl-1 lg:flex">
            <LanguageSwitch locale={locale} />
            <ThemeToggle />
          </div>
          <div className="lg:hidden">
            <MobileNav locale={locale} categories={navCategories} />
          </div>
        </div>
      </div>
    </header>
  );
}
