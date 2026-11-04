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

  return (
    <aside
      className={cn(
        "rounded-md border border-border bg-muted/30 p-3",
        className,
      )}
      aria-label="Sponsored"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Sponsored
      </p>
      {ad.scriptHtml ? (
        <div
          className="overflow-hidden"
          dangerouslySetInnerHTML={{ __html: ad.scriptHtml }}
        />
      ) : ad.imageUrl ? (
        ad.destinationUrl ? (
          <a
            href={ad.destinationUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.imageUrl}
              alt={ad.name}
              className="mx-auto max-h-40 w-auto object-contain"
            />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.imageUrl}
            alt={ad.name}
            className="mx-auto max-h-40 w-auto object-contain"
          />
        )
      ) : ad.destinationUrl ? (
        <a
          href={ad.destinationUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="text-sm font-medium text-gvn-red hover:underline"
        >
          {ad.name}
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">{ad.name}</p>
      )}
    </aside>
  );
}
