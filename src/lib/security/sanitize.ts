import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h2",
  "h3",
  "h4",
  "p",
  "strong",
  "em",
  "a",
  "blockquote",
  "ul",
  "ol",
  "li",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "br",
  "div",
  "span",
];

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      div: ["data-youtube-video", "data-vimeo-video", "class"],
      span: ["class"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}

const EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
]);

export function parseSafeVideoEmbed(
  url: string,
): { provider: "youtube" | "vimeo"; id: string } | null {
  try {
    const u = new URL(url);
    if (!EMBED_HOSTS.has(u.hostname)) return null;
    if (u.hostname.includes("youtube")) {
      const id =
        u.searchParams.get("v") ||
        (u.pathname.startsWith("/embed/")
          ? u.pathname.split("/")[2]
          : u.pathname.startsWith("/shorts/")
            ? u.pathname.split("/")[2]
            : null);
      if (!id || !/^[\w-]{6,}$/.test(id)) return null;
      return { provider: "youtube", id };
    }
    if (u.hostname.includes("vimeo")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (!id || !/^\d+$/.test(id)) return null;
      return { provider: "vimeo", id };
    }
    return null;
  } catch {
    return null;
  }
}
