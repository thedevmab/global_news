import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Play } from "lucide-react";
import { localePath, type Locale } from "@/i18n";
import type { ChannelVideo } from "@/lib/youtube";

export function ChannelVideoCard({
  video,
  locale = "en",
}: {
  video: ChannelVideo;
  locale?: Locale;
}) {
  const when = video.publishedAt ? new Date(video.publishedAt) : null;
  const dateLabel =
    when && !Number.isNaN(when.getTime()) ? format(when, "MMM d, yyyy") : null;

  return (
    <Link
      href={localePath(locale, `/videos/${video.id}`)}
      className="group block"
    >
      <span className="gvn-media relative block aspect-video bg-gvn-navy">
        <Image
          src={video.thumbnailUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gvn-navy shadow-sm">
          <Play className="h-4 w-4 fill-current" aria-hidden />
        </span>
      </span>
      <h2 className="mt-3 font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-gvn-red">
        {video.title}
      </h2>
      {dateLabel ? (
        <time
          dateTime={video.publishedAt}
          className="mt-1 block text-xs text-muted-foreground"
        >
          {dateLabel}
        </time>
      ) : null}
    </Link>
  );
}
