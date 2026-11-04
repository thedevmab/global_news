import Link from "next/link";
import { ChannelVideoCard } from "@/components/media/ChannelVideoCard";
import { EmptyState } from "@/components/ui/empty-state";
import { GVN_YOUTUBE_CHANNEL_URL, getChannelVideos } from "@/lib/youtube";

export const metadata = { title: "Video news" };

export default async function VideosPage() {
  let videos: Awaited<ReturnType<typeof getChannelVideos>> = [];
  let failed = false;
  try {
    videos = await getChannelVideos();
  } catch {
    failed = true;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-foreground">
            Video news
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Latest videos from the Global Voice Network YouTube channel.
          </p>
        </div>
        <Link
          href={GVN_YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-gvn-red hover:underline"
        >
          @globalvoicenetwork_official
        </Link>
      </div>

      {failed ? (
        <EmptyState
          title="Videos are unavailable"
          description="The YouTube channel could not be reached. Try again in a moment."
        />
      ) : videos.length === 0 ? (
        <EmptyState
          title="No videos yet"
          description="New videos from the channel will appear here."
        />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <ChannelVideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
