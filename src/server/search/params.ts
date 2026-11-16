export type SearchContentType = "all" | "article" | "video" | "podcast";
export type SearchSort = "relevance" | "newest" | "oldest";
export type SearchLanguage = "en" | "am" | "";

export type ParsedSearchParams = {
  q: string;
  category: string;
  type: SearchContentType;
  from: string;
  to: string;
  author: string;
  sort: SearchSort;
  language: SearchLanguage;
  page: number;
  pageSize: number;
};

const CONTENT_TYPES = new Set<SearchContentType>([
  "all",
  "article",
  "video",
  "podcast",
]);

const SORTS = new Set<SearchSort>(["relevance", "newest", "oldest"]);

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime());
}

function pick(
  input: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = input[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export function parseSearchParams(
  input: Record<string, string | string[] | undefined>,
  opts?: { defaultLanguage?: SearchLanguage; pageSize?: number },
): ParsedSearchParams {
  const q = pick(input, "q");
  const category = pick(input, "category");
  const author = pick(input, "author");
  const rawType = pick(input, "type") as SearchContentType;
  const type = CONTENT_TYPES.has(rawType) ? rawType : "all";
  const rawSort = pick(input, "sort") as SearchSort;
  const sort = SORTS.has(rawSort) ? rawSort : "relevance";

  let language: SearchLanguage = "";
  if (Object.prototype.hasOwnProperty.call(input, "language")) {
    const rawLang = pick(input, "language");
    if (rawLang === "en" || rawLang === "am") language = rawLang;
    else language = "";
  } else if (opts?.defaultLanguage === "en" || opts?.defaultLanguage === "am") {
    language = opts.defaultLanguage;
  }

  const fromRaw = pick(input, "from");
  const toRaw = pick(input, "to");
  const from = isIsoDate(fromRaw) ? fromRaw : "";
  const to = isIsoDate(toRaw) ? toRaw : "";

  const page = Math.max(1, Number(pick(input, "page") || "1") || 1);
  const pageSize = Math.min(48, Math.max(1, opts?.pageSize ?? 12));

  return {
    q,
    category,
    type,
    from,
    to,
    author,
    sort,
    language,
    page,
    pageSize,
  };
}

/** Escape `%` and `_` for safe ILIKE patterns. */
export function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
