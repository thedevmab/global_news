import { Suspense } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BreakingTicker } from "./BreakingTicker";
import { SiteDateTimeBar } from "./SiteDateTimeBar";
import { AdSlot } from "@/components/media/AdSlot";
import { getBreakingNews } from "@/server/articles/public";
import { getDictionary, type Locale } from "@/i18n";

async function BreakingTickerSection({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  let breaking: Awaited<ReturnType<typeof getBreakingNews>> = [];
  try {
    breaking = await getBreakingNews(undefined, 5);
  } catch {
    breaking = [];
  }

  return (
    <BreakingTicker
      locale={locale}
      dict={dict}
      items={breaking.map((b) => ({
        id: b.id,
        headline: b.headline,
        slug: b.slug,
        language: b.language,
        categorySlug: b.category.slug,
      }))}
    />
  );
}

export async function PublicShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <div
      className={locale === "am" ? "lang-am flex min-h-full flex-col" : "flex min-h-full flex-col"}
      lang={locale}
    >
      <SiteDateTimeBar locale={locale} />
      <Suspense fallback={null}>
        <BreakingTickerSection locale={locale} />
      </Suspense>
      <Header locale={locale} />
      <Suspense fallback={null}>
        <AdSlot slotKey="HEADER" className="mx-auto max-w-7xl px-4 py-3" />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={null}>
        <AdSlot slotKey="FOOTER" className="mx-auto max-w-7xl px-4 py-3" />
      </Suspense>
      <Footer locale={locale} />
    </div>
  );
}
