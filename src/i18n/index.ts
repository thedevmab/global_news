import { en, type Dictionary } from "./en";
import { am } from "./am";

export type Locale = "en" | "am";

export function getDictionary(locale: Locale = "en"): Dictionary {
  return locale === "am" ? am : en;
}

export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "en") return clean === "" ? "/" : clean;
  if (clean === "/") return "/am";
  return `/am${clean}`;
}

/** Public article URL using the story language (so Amharic posts open under /am). */
export function articlePath(article: {
  language: string;
  slug: string;
  category: { slug: string };
}): string {
  const locale: Locale = article.language === "am" ? "am" : "en";
  return localePath(locale, `/${article.category.slug}/${article.slug}`);
}
