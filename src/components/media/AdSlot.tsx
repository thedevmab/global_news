import type { AdSlotKey } from "@prisma/client";
import { getActiveAd } from "@/server/articles/public";
import { cn } from "@/lib/utils";

export async function AdSlot({
  slotKey,
  className,
}: {
  slotKey: AdSlotKey;
  className?: string;
}) {
  const ad = await getActiveAd(slotKey);
  if (!ad) return null;

  const image = ad.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ad.imageUrl}
      alt={ad.name}
      className="mx-auto h-auto max-h-36 w-full max-w-5xl object-contain md:max-h-44"
    />
  ) : null;

  return (
    <aside
      className={cn("w-full", className)}
      aria-label="Sponsored"
    >
      <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Sponsored
      </p>
      {ad.scriptHtml ? (
        <div
          className="overflow-hidden"
          dangerouslySetInnerHTML={{ __html: ad.scriptHtml }}
        />
      ) : image ? (
        ad.destinationUrl ? (
          <a
            href={ad.destinationUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block"
          >
            {image}
          </a>
        ) : (
          image
        )
      ) : ad.destinationUrl ? (
        <a
          href={ad.destinationUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block text-center text-sm font-medium text-gvn-red hover:underline"
        >
          {ad.name}
        </a>
      ) : (
        <p className="text-center text-sm text-muted-foreground">{ad.name}</p>
      )}
    </aside>
  );
}
