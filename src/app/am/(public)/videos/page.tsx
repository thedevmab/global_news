import type { Metadata } from "next";
import Link from "next/link";
import { ChannelVideoCard } from "@/components/media/ChannelVideoCard";
import { EmptyState } from "@/components/ui/empty-state";
import { getDictionary } from "@/i18n";
import { GVN_YOUTUBE_CHANNEL_URL, getChannelVideos } from "@/lib/youtube";

export const metadata: Metadata = { title: "ቪዲዮ" };

export default async function Page() {
  const dict = getDictionary("am");
  let videos: Awaited<ReturnType<typeof getChannelVideos>> = [];
  let failed = false;
  try {
    videos = await getChannelVideos();
  } catch {
    failed = true;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <h1 className="font-serif text-3xl font-semibold">{dict.nav.videos}</h1>
        <Link
          href={GVN_YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-gvn-red hover:underline"
        >
          YouTube
        </Link>
      </div>
      {failed || videos.length === 0 ? (
        <EmptyState
          title={dict.home.emptyTitle}
          description={dict.home.emptyDescription}
        />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <ChannelVideoCard key={video.id} video={video} locale="am" />
          ))}
        </div>
      )}
    </div>
  );
}
