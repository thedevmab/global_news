import type { Dictionary } from "@/i18n/en";

const known = [
  "politics",
  "business",
  "technology",
  "sports",
  "entertainment",
  "world",
  "national",
] as const;

type KnownSlug = (typeof known)[number];

export function categoryBlurb(
  dict: Dictionary,
  slug: string,
  description?: string | null,
) {
  const text = description?.replace(/\s+/g, " ").trim();
  if (text) return text;
  if ((known as readonly string[]).includes(slug)) {
    return dict.categoryBlurbs[slug as KnownSlug];
  }
  return dict.categoryBlurbs.default;
}
