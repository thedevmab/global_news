import { absoluteUrl, excerpt } from "@/lib/utils";

export type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: Date | string;
  guid?: string;
  category?: string;
  author?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toUTCString();
}

export function buildRssFeed(opts: {
  title: string;
  description: string;
  path: string;
  items: RssItem[];
}): string {
  const channelLink = absoluteUrl(opts.path === "/rss.xml" ? "/" : opts.path.replace(/\/rss\.xml$/, ""));
  const selfLink = absoluteUrl(opts.path);

  const itemsXml = opts.items
    .map((item) => {
      const link = item.link.startsWith("http")
        ? item.link
        : absoluteUrl(item.link);
      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid || link)}</guid>
      <pubDate>${rfc822(item.pubDate)}</pubDate>
      <description>${escapeXml(excerpt(item.description, 300))}</description>
      ${item.category ? `<category>${escapeXml(item.category)}</category>` : ""}
      ${item.author ? `<author>${escapeXml(item.author)}</author>` : ""}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(opts.title)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(opts.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(selfLink)}" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;
}

export function rssResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}
