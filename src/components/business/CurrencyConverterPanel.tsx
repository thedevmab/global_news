import { getDictionary, type Locale } from "@/i18n";
import { getCurrencyBoard } from "@/lib/currency-rates";
import { CurrencyConverterClient } from "./CurrencyConverterClient";

export async function CurrencyConverterPanel({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const board = await getCurrencyBoard();

  if (board.failed) {
    return (
      <p className="rounded-md border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
        {dict.businessPage.unavailable}
      </p>
    );
  }

  return <CurrencyConverterClient locale={locale} board={board} />;
}
