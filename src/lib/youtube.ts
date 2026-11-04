const CHANNEL_ID = "UCOuW4Yezf-lUjdhCRlyhXqA";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export const GVN_YOUTUBE_CHANNEL_URL =
  "https://www.youtube.com/@globalvoicenetwork_official";

export type ChannelVideo = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  description: string;
  watchUrl: string;
};

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(entry: string, name: string): string {
  const match = entry.match(
    new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"),
  );
  return match ? decodeXml(match[1]) : "";
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export async function getChannelVideos(): Promise<ChannelVideo[]> {
  const response = await fetch(FEED_URL, {
    next: { revalidate: 1800 },
    headers: {
      "user-agent": "GVN-Newsroom/1.0",
      accept: "application/atom+xml, application/xml, text/xml",
    },
  });
  if (!response.ok) {
    throw new Error(`YouTube feed returned ${response.status}`);
  }
  const xml = await response.text();
  const entries = xml.split("<entry>").slice(1);

  return entries
    .map((entry) => {
      const id = tag(entry, "yt:videoId");
      if (!id) return null;
      const publishedAt = tag(entry, "published");
      const description = tag(entry, "media:description");
      return {
        id,
        title: tag(entry, "title"),
        publishedAt,
        thumbnailUrl: youtubeThumbnail(id),
        description,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
      } satisfies ChannelVideo;
    })
    .filter((video): video is ChannelVideo => Boolean(video));
}

export async function getChannelVideo(
  id: string,
): Promise<ChannelVideo | null> {
  if (!/^[\w-]{6,}$/.test(id)) return null;
  const videos = await getChannelVideos();
  return videos.find((video) => video.id === id) ?? null;
}
