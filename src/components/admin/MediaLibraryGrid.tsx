"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { mediaPublicUrl } from "@/lib/media-url";
import { mediaDeleteAction, mediaMetaAction } from "@/server/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MediaLibraryItem = {
  id: string;
  storageKey: string;
  originalName: string;
  altText: string | null;
  caption: string | null;
  credit: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  uploadedBy: { name: string } | null;
};

export function MediaLibraryGrid({ items }: { items: MediaLibraryItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No media yet. Upload an image above.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <li key={item.id}>
          <MediaLibraryCard item={item} />
        </li>
      ))}
    </ul>
  );
}

function MediaLibraryCard({ item }: { item: MediaLibraryItem }) {
  const [altText, setAltText] = useState(item.altText ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [credit, setCredit] = useState(item.credit ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const src = mediaPublicUrl(item.storageKey);

  function saveMeta() {
    setMessage(null);
    startTransition(async () => {
      const result = await mediaMetaAction(item.id, {
        altText: altText || null,
        caption: caption || null,
        credit: credit || null,
      });
      setMessage(result.ok ? "Saved" : result.error);
    });
  }

  function remove() {
    if (!window.confirm(`Delete “${item.originalName}”?`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await mediaDeleteAction(item.id);
      if (!result.ok) setMessage(result.error);
    });
  }

  return (
    <article className="overflow-hidden border border-border bg-card">
      <div className="relative aspect-[4/3] bg-muted">
        <Image
          src={src}
          alt={altText || item.originalName}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 25vw"
          unoptimized
        />
      </div>
      <div className="space-y-2 p-3">
        <p className="truncate text-xs font-medium" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {item.width && item.height ? `${item.width}×${item.height} · ` : null}
          {item.uploadedBy?.name ?? "Unknown"}
        </p>
        <Input
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Alt text"
          className="h-8 text-xs"
        />
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption"
          className="h-8 text-xs"
        />
        <Input
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          placeholder="Credit"
          className="h-8 text-xs"
        />
        {message ? (
          <p className="text-xs text-muted-foreground">{message}</p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={saveMeta}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-gvn-red"
            disabled={pending}
            onClick={remove}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}
