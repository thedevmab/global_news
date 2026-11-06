import sanitizeHtml from "sanitize-html";

/** Escape text for safe insertion into HTML email / templates. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Allow only Postgres ts_headline <mark> wrappers in search snippets. */
export function sanitizeSearchHighlight(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["mark"],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}

/** Same-origin path or absolute http(s) URL — rejects protocol-relative //evil. */
export function isSafePublicUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (v.startsWith("/")) {
    return /^\/(?!\/)[\w.~/?#&=%-]*$/i.test(v);
  }
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
