/** Public URL for a stored media object (local /media proxy or remote blob/CDN URL). */
export function mediaUrl(storageKey: string | null | undefined): string | null {
  if (!storageKey) return null;
  if (/^https?:\/\//i.test(storageKey)) return storageKey;
  return `/media/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
}

/** Always returns a string path for admin UI use. */
export function mediaPublicUrl(storageKey: string): string {
  return mediaUrl(storageKey) || `/media/${storageKey}`;
}

type Variant = {
  label: string;
  storageKey: string;
  width?: number | null;
  height?: number | null;
};

type MediaLike = {
  storageKey: string;
  variants?: Variant[] | null;
} | null | undefined;

const VARIANT_ORDER = ["small", "medium", "large"] as const;

/**
 * Pick the smallest variant that is at least `minWidth`, else largest smaller,
 * else original.
 */
export function pickVariantKey(
  media: MediaLike,
  minWidth: number,
): string | null {
  if (!media?.storageKey) return null;
  const variants = media.variants ?? [];
  const byLabel = new Map(
    variants.map((v) => [v.label, v] as const),
  );

  let best: Variant | null = null;
  for (const label of VARIANT_ORDER) {
    const v = byLabel.get(label);
    if (!v) continue;
    const w = v.width ?? 0;
    if (w >= minWidth) return mediaUrl(v.storageKey);
    best = v;
  }

  if (best) return mediaUrl(best.storageKey);
  return mediaUrl(media.storageKey);
}
