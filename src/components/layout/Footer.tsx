import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { parseSiteSettings } from "@/lib/site-settings";
import {
  getActiveCategories,
  getNavigationItems,
  getSiteSettingsRow,
} from "@/server/articles/public";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SocialLinks } from "@/components/media/SocialLinks";

function categoryLabel(
  locale: Locale,
  cat: { nameEn: string; nameAm: string | null },
) {
  return locale === "am" && cat.nameAm ? cat.nameAm : cat.nameEn;
}

export async function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [categories, footerNav, settingsRow] = await Promise.all([
    getActiveCategories(),
    getNavigationItems("footer"),
    getSiteSettingsRow(),
  ]);
  const settings = parseSiteSettings(settingsRow?.data);
  const year = new Date().getFullYear();

  const hasContact = footerNav.some(
    (item) => item.href === "/contact" || item.href.endsWith("/contact"),
  );

  return (
    <footer className="mt-auto border-t border-chrome-border bg-chrome text-chrome-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Link href={localePath(locale, "/")} aria-label={dict.siteName}>
            <BrandLogo
              width={144}
              height={51}
              imageClassName="h-10 w-auto"
            />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-chrome-foreground/75">
            {dict.footer.blurb}
          </p>
          <SocialLinks
            links={settings.socialLinks}
            tone="onChrome"
            size="sm"
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-chrome-foreground">
            {dict.footer.quickLinks}
          </h2>
          <ul className="space-y-2 text-sm text-chrome-foreground/70">
            {footerNav.map((item) => (
              <li key={item.id}>
                {item.isExternal ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-chrome-foreground"
                  >
                    {locale === "am" && item.labelAm
                      ? item.labelAm
                      : item.labelEn}
                  </a>
                ) : (
                  <Link
                    href={localePath(locale, item.href)}
                    className="hover:text-chrome-foreground"
                  >
                    {locale === "am" && item.labelAm
                      ? item.labelAm
                      : item.labelEn}
                  </Link>
                )}
              </li>
            ))}
            {hasContact ? null : (
              <li>
                <Link
                  href={localePath(locale, "/contact")}
                  className="hover:text-chrome-foreground"
                >
                  {dict.nav.contact}
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2
            id="footer-categories"
            className="mb-3 scroll-mt-24 text-sm font-semibold text-chrome-foreground"
          >
            {dict.footer.categories}
          </h2>
          <ul className="space-y-2 text-sm text-chrome-foreground/70">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={localePath(locale, `/${c.slug}`)}
                  className="hover:text-chrome-foreground"
                >
                  {categoryLabel(locale, c)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-chrome-foreground">
            {dict.footer.subscribe}
          </h2>
          <NewsletterForm dict={dict} variant="stacked" tone="onChrome" />
        </div>
      </div>

      <div className="border-t border-chrome-border bg-surface text-surface-foreground">
        <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-chrome-foreground/55">
          © {year} {dict.siteName}. {dict.footer.rights}
        </div>
      </div>
    </footer>
  );
}
