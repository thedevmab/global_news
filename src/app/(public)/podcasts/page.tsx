import Link from "next/link";
import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

export const metadata = { title: "Podcasts" };

export default async function PodcastsPage() {
  const episodes = await prisma.podcast.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: new Date() },
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 font-serif text-4xl font-bold">Podcasts</h1>
      {episodes.length === 0 ? (
        <EmptyState
          title="No episodes yet"
          description="Published podcast episodes will appear here."
        />
      ) : (
        <div className="space-y-4">
          {episodes.map((p) => (
            <Link
              key={p.id}
              href={`/podcasts/${p.slug}`}
              className="block rounded-lg border border-border p-4 hover:border-gvn-red"
            >
              <h2 className="text-lg font-semibold">
                {p.episodeNumber ? `Ep. ${p.episodeNumber}: ` : ""}
                {p.title}
              </h2>
              {p.publishedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(p.publishedAt, "MMM d, yyyy")}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
