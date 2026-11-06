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
