const PRIMARY = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/etb.json";
const FALLBACK =
  "https://latest.currency-api.pages.dev/v1/currencies/etb.json";
const REVALIDATE = 3600;

export type CurrencyCode =
  | "ETB"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "SAR"
  | "CNY"
  | "JPY"
  | "INR"
  | "KES"
  | "ZAR"
  | "NGN"
  | "EGP"
  | "CAD"
  | "AUD"
  | "CHF"
  | "TRY"
  | "SEK"
  | "NOK"
  | "DKK"
  | "SGD"
  | "HKD"
  | "QAR"
  | "KWD";

export type CurrencyMeta = {
  code: CurrencyCode;
  nameEn: string;
  nameAm: string;
  symbol: string;
};

/** World majors + regional currencies relevant to Ethiopian readers. No crypto. */
export const CURRENCIES: CurrencyMeta[] = [
  { code: "ETB", nameEn: "Ethiopian Birr", nameAm: "የኢትዮጵያ ብር", symbol: "Br" },
  { code: "USD", nameEn: "US Dollar", nameAm: "የአሜሪካ ዶላር", symbol: "$" },
  { code: "EUR", nameEn: "Euro", nameAm: "ዩሮ", symbol: "€" },
  { code: "GBP", nameEn: "British Pound", nameAm: "የብሪታንያ ፓውንድ", symbol: "£" },
  { code: "AED", nameEn: "UAE Dirham", nameAm: "የተባበሩት አረብ ኤሚሬቶች ዲርሃም", symbol: "د.إ" },
  { code: "SAR", nameEn: "Saudi Riyal", nameAm: "የሳውዲ ሪያል", symbol: "﷼" },
  { code: "QAR", nameEn: "Qatari Riyal", nameAm: "የኳታር ሪያል", symbol: "ر.ق" },
  { code: "KWD", nameEn: "Kuwaiti Dinar", nameAm: "የኩዌት ዲናር", symbol: "د.ك" },
  { code: "CNY", nameEn: "Chinese Yuan", nameAm: "የቻይና ዩዋን", symbol: "¥" },
  { code: "JPY", nameEn: "Japanese Yen", nameAm: "የጃፓን የን", symbol: "¥" },
  { code: "INR", nameEn: "Indian Rupee", nameAm: "የህንድ ሩፒ", symbol: "₹" },
  { code: "KES", nameEn: "Kenyan Shilling", nameAm: "የኬንያ ሺሊንግ", symbol: "KSh" },
  { code: "EGP", nameEn: "Egyptian Pound", nameAm: "የግብጽ ፓውንድ", symbol: "E£" },
  { code: "ZAR", nameEn: "South African Rand", nameAm: "የደቡብ አፍሪካ ራንድ", symbol: "R" },
  { code: "NGN", nameEn: "Nigerian Naira", nameAm: "የናይጄሪያ ናይራ", symbol: "₦" },
  { code: "CAD", nameEn: "Canadian Dollar", nameAm: "የካናዳ ዶላር", symbol: "C$" },
  { code: "AUD", nameEn: "Australian Dollar", nameAm: "የአውስትራሊያ ዶላር", symbol: "A$" },
  { code: "CHF", nameEn: "Swiss Franc", nameAm: "የስዊስ ፍራንክ", symbol: "Fr" },
  { code: "TRY", nameEn: "Turkish Lira", nameAm: "የቱርክ ሊራ", symbol: "₺" },
  { code: "SEK", nameEn: "Swedish Krona", nameAm: "የስዊድን ክሮና", symbol: "kr" },
  { code: "NOK", nameEn: "Norwegian Krone", nameAm: "የኖርዌይ ክሮን", symbol: "kr" },
  { code: "DKK", nameEn: "Danish Krone", nameAm: "የዴንማርክ ክሮን", symbol: "kr" },
  { code: "SGD", nameEn: "Singapore Dollar", nameAm: "የሲንጋፖር ዶላር", symbol: "S$" },
  { code: "HKD", nameEn: "Hong Kong Dollar", nameAm: "የሆንግ ኮንግ ዶላር", symbol: "HK$" },
];

export const QUICK_PAIRS: Array<{ from: CurrencyCode; to: CurrencyCode }> = [
  { from: "ETB", to: "USD" },
  { from: "ETB", to: "EUR" },
  { from: "ETB", to: "GBP" },
  { from: "ETB", to: "AED" },
  { from: "ETB", to: "KES" },
  { from: "USD", to: "ETB" },
];

export type CurrencyBoard = {
  date: string | null;
  base: "ETB";
  /** Units of foreign currency per 1 ETB */
  rates: Partial<Record<CurrencyCode, number>>;
  failed: boolean;
};

type RawEtbPayload = {
  date?: string;
  etb?: Record<string, number>;
};

async function fetchEtbJson(url: string): Promise<RawEtbPayload | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE },
      headers: {
        accept: "application/json",
        "user-agent": "GVN-Newsroom/1.0",
      },
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") || "";
    if (!type.includes("json")) {
      const text = await response.text();
      if (text.trimStart().startsWith("<")) return null;
      try {
        return JSON.parse(text) as RawEtbPayload;
      } catch {
        return null;
      }
    }
    return (await response.json()) as RawEtbPayload;
  } catch {
    return null;
  }
}

export async function getCurrencyBoard(): Promise<CurrencyBoard> {
  const payload =
    (await fetchEtbJson(PRIMARY)) ?? (await fetchEtbJson(FALLBACK));

  if (!payload?.etb || typeof payload.etb !== "object") {
    return { date: null, base: "ETB", rates: { ETB: 1 }, failed: true };
  }

  const rates: Partial<Record<CurrencyCode, number>> = { ETB: 1 };
  for (const meta of CURRENCIES) {
    if (meta.code === "ETB") continue;
    const value = payload.etb[meta.code.toLowerCase()];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      rates[meta.code] = value;
    }
  }

  return {
    date: payload.date ?? null,
    base: "ETB",
    rates,
    failed: Object.keys(rates).length <= 1,
  };
}

/**
 * Convert using ETB as the pivot.
 * `rates[code]` means: 1 ETB = rates[code] units of `code`.
 */
export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Partial<Record<CurrencyCode, number>>,
): number | null {
  if (!Number.isFinite(amount)) return null;
  if (from === to) return amount;

  const fromRate = from === "ETB" ? 1 : rates[from];
  const toRate = to === "ETB" ? 1 : rates[to];
  if (
    fromRate == null ||
    toRate == null ||
    !Number.isFinite(fromRate) ||
    !Number.isFinite(toRate) ||
    fromRate <= 0
  ) {
    return null;
  }

  const inEtb = amount / fromRate;
  return inEtb * toRate;
}

export function formatMoney(
  value: number,
  code: CurrencyCode,
  locale: "en" | "am",
): string {
  const digits = code === "JPY" ? 0 : value >= 1000 ? 2 : 4;
  try {
    return new Intl.NumberFormat(locale === "am" ? "am-ET" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return value.toFixed(Math.min(digits, 4));
  }
}
