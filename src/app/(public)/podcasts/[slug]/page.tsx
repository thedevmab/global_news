import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export default async function PodcastDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = await prisma.podcast.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: new Date() },
    },
  });
  if (!episode) notFound();

  const audioMedia = episode.audioMediaId
    ? await prisma.media.findUnique({ where: { id: episode.audioMediaId } })
    : null;
  const audioSrc =
    episode.audioUrl ||
    (audioMedia ? `/media/${audioMedia.storageKey}` : null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 font-serif text-4xl font-bold">
        {episode.episodeNumber ? `Episode ${episode.episodeNumber}: ` : ""}
        {episode.title}
      </h1>
      {episode.publishedAt ? (
        <p className="mb-6 text-sm text-muted-foreground">
          {format(episode.publishedAt, "MMM d, yyyy")}
        </p>
      ) : null}
      {audioSrc ? (
        <audio controls className="mb-8 w-full" preload="metadata" src={audioSrc}>
          Your browser does not support the audio element.
        </audio>
      ) : (
        <p className="mb-8 text-muted-foreground">Audio unavailable.</p>
      )}
      {episode.showNotes ? (
        <div className="prose-article whitespace-pre-wrap">{episode.showNotes}</div>
      ) : null}
    </div>
  );
}
