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
