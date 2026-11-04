import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getChannelVideo } from "@/lib/youtube";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const channel = await getChannelVideo(slug).catch(() => null);
  if (channel) {
    return {
      title: channel.title,
      description: channel.description.slice(0, 160),
      openGraph: { images: [channel.thumbnailUrl] },
    };
  }
  return { title: "Video" };
}

export default async function VideoDetailPage({ params }: Params) {
  const { slug } = await params;
  const channel = await getChannelVideo(slug).catch(() => null);

  if (channel) {
    const when = new Date(channel.publishedAt);
    const excerpt = channel.description.replace(/\s+/g, " ").trim().slice(0, 700);
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          {" / "}
          <Link href="/videos" className="hover:underline">
            Videos
          </Link>
        </nav>
        <h1 className="mb-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {channel.title}
        </h1>
        {!Number.isNaN(when.getTime()) ? (
          <p className="mb-6 text-sm text-muted-foreground">
            <time dateTime={channel.publishedAt}>{format(when, "MMM d, yyyy")}</time>
            {" · "}
            <a
              href={channel.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gvn-red hover:underline"
            >
              Watch on YouTube
            </a>
          </p>
        ) : null}
        <div className="aspect-video overflow-hidden rounded-md bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${channel.id}`}
            title={channel.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        {excerpt ? (
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {excerpt}
          </p>
        ) : null}
      </div>
    );
  }

  const video = await prisma.video.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: new Date() },
    },
    include: { category: true },
  });
  if (!video) notFound();

  const src =
    video.provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${video.providerId}`
      : `https://player.vimeo.com/video/${video.providerId}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 font-serif text-4xl font-bold text-foreground">{video.title}</h1>
      {video.publishedAt ? (
        <p className="mb-6 text-sm text-muted-foreground">
          {format(video.publishedAt, "MMM d, yyyy")}
          {video.category ? ` · ${video.category.nameEn}` : ""}
        </p>
      ) : null}
      <div className="aspect-video overflow-hidden rounded-md bg-black">
        <iframe
          src={src}
          title={video.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {video.description ? (
        <p className="mt-6 whitespace-pre-wrap text-muted-foreground">
          {video.description}
        </p>
      ) : null}
    </div>
  );
}
