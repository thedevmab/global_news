import { Header } from "./Header";
import { Footer } from "./Footer";
import { BreakingTicker } from "./BreakingTicker";
import { SiteDateTimeBar } from "./SiteDateTimeBar";
import { AdSlot } from "@/components/media/AdSlot";
import { getBreakingNews } from "@/server/articles/public";
import { getDictionary, type Locale } from "@/i18n";

export async function PublicShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const dict = getDictionary(locale);
  let breaking: Awaited<ReturnType<typeof getBreakingNews>> = [];
  try {
    breaking = await getBreakingNews(locale, 5);
  } catch {
    // Build/deploy can run before tables exist; avoid crashing the shell.
    breaking = [];
  }

  return (
    <div
      className={locale === "am" ? "lang-am flex min-h-full flex-col" : "flex min-h-full flex-col"}
      lang={locale}
    >
      <SiteDateTimeBar locale={locale} />
      <BreakingTicker
        locale={locale}
        dict={dict}
        items={breaking.map((b) => ({
          id: b.id,
          headline: b.headline,
          slug: b.slug,
          categorySlug: b.category.slug,
        }))}
      />
      <Header locale={locale} />
      <AdSlot slotKey="HEADER" className="mx-auto max-w-7xl px-4 py-3" />
      <main className="flex-1">{children}</main>
      <AdSlot slotKey="FOOTER" className="mx-auto max-w-7xl px-4 py-3" />
      <Footer locale={locale} />
    </div>
  );
}
