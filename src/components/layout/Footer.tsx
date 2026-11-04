import Image from "next/image";
import Link from "next/link";
import { Facebook, Linkedin, Send, Youtube } from "lucide-react";
import { getDictionary, localePath, type Locale } from "@/i18n";
import { parseSiteSettings } from "@/lib/site-settings";
import {
  getActiveCategories,
  getNavigationItems,
  getSiteSettingsRow,
} from "@/server/articles/public";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

function categoryLabel(
  locale: Locale,
  cat: { nameEn: string; nameAm: string | null },
) {
  return locale === "am" && cat.nameAm ? cat.nameAm : cat.nameEn;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

const socialIcon = {
  Facebook,
  X: XIcon,
  YouTube: Youtube,
  Telegram: Send,
  LinkedIn: Linkedin,
} as const;

export async function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [categories, footerNav, settingsRow] = await Promise.all([
    getActiveCategories(),
    getNavigationItems("footer"),
    getSiteSettingsRow(),
  ]);
  const settings = parseSiteSettings(settingsRow?.data);
  const year = new Date().getFullYear();
  const social = settings.socialLinks;

  const socialEntries = (
    [
      ["Facebook", social.facebook, socialIcon.Facebook],
      ["X", social.x, socialIcon.X],
      ["YouTube", social.youtube, socialIcon.YouTube],
      ["Telegram", social.telegram, socialIcon.Telegram],
      ["LinkedIn", social.linkedin, socialIcon.LinkedIn],
    ] as const
  ).filter((entry) => Boolean(entry[1]));

  const hasContact = footerNav.some(
    (item) => item.href === "/contact" || item.href.endsWith("/contact"),
  );

  return (
    <footer className="mt-auto bg-gvn-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Link href={localePath(locale, "/")} aria-label={dict.siteName}>
            <Image
              src="/brand/gvn-logo-mark.png"
              alt=""
              width={144}
              height={51}
              className="h-10 w-auto"
            />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-white/75">
            {dict.footer.blurb}
          </p>
          {socialEntries.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {socialEntries.map(([label, href, Icon]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 focus-visible:!outline-white"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-white">
            {dict.footer.quickLinks}
          </h2>
          <ul className="space-y-2 text-sm text-white/70">
            {footerNav.map((item) => (
              <li key={item.id}>
                {item.isExternal ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    {locale === "am" && item.labelAm
                      ? item.labelAm
                      : item.labelEn}
                  </a>
                ) : (
                  <Link
                    href={localePath(locale, item.href)}
                    className="hover:text-white"
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
                  className="hover:text-white"
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
            className="mb-3 scroll-mt-24 text-sm font-semibold text-white"
          >
            {dict.footer.categories}
          </h2>
          <ul className="space-y-2 text-sm text-white/70">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={localePath(locale, `/${c.slug}`)}
                  className="hover:text-white"
                >
                  {categoryLabel(locale, c)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-white">
            {dict.footer.subscribe}
          </h2>
          <NewsletterForm dict={dict} variant="stacked" tone="onDark" />
        </div>
      </div>

      <div className="bg-gvn-deep-navy">
        <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-white/55">
          © {year} {dict.siteName}. {dict.footer.rights}
        </div>
      </div>
    </footer>
  );
}
