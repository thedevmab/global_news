/** Public URL for a stored media object (rewritten to /api/media). */
export function mediaUrl(storageKey: string | null | undefined): string | null {
  if (!storageKey) return null;
  return `/media/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
}

/** Always returns a string path for admin UI use. */
export function mediaPublicUrl(storageKey: string): string {
  return mediaUrl(storageKey) || `/media/${storageKey}`;
}
