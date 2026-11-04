import { Header } from "./Header";
import { Footer } from "./Footer";
import { BreakingTicker } from "./BreakingTicker";
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
  const breaking = await getBreakingNews(locale, 5);

  return (
    <div
      className={locale === "am" ? "lang-am flex min-h-full flex-col" : "flex min-h-full flex-col"}
      lang={locale}
    >
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
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
