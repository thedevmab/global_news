import type { AdSlotKey } from "@prisma/client";
import { getActiveAd } from "@/server/articles/public";
import { isSafePublicUrl } from "@/lib/security/html";
import { cn } from "@/lib/utils";

export async function AdSlot({
  slotKey,
  className,
}: {
  slotKey: AdSlotKey;
  className?: string;
}) {
  let ad: Awaited<ReturnType<typeof getActiveAd>> = null;
  try {
    ad = await getActiveAd(slotKey);
  } catch {
    return null;
  }
  if (!ad) return null;

  const destination =
    ad.destinationUrl && isSafePublicUrl(ad.destinationUrl)
      ? ad.destinationUrl
      : null;

  const image = ad.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ad.imageUrl}
      alt={ad.name}
      className="gvn-media mx-auto h-auto max-h-36 w-full max-w-5xl object-contain md:max-h-44"
    />
  ) : null;

  return (
    <aside className={cn("w-full", className)} aria-label="Sponsored">
      <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Sponsored
      </p>
      {ad.scriptHtml ? (
        // Isolate third-party ad markup from the parent document (no allow-same-origin).
        <iframe
          title={ad.name}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          srcDoc={ad.scriptHtml}
          className="mx-auto h-28 w-full max-w-5xl border-0 md:h-36"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : image ? (
        destination ? (
          <a
            href={destination}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block"
          >
            {image}
          </a>
        ) : (
          image
        )
      ) : destination ? (
        <a
          href={destination}
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
