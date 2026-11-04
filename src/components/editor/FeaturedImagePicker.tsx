"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadMediaFile } from "@/lib/admin-media-client";
import { mediaPublicUrl } from "@/lib/media-url";
import { listRecentMediaAction } from "@/server/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type RecentItem = {
  id: string;
  storageKey: string;
  originalName: string;
  altText: string | null;
};

export function FeaturedImagePicker({
  value,
  previewUrl,
  onChange,
}: {
  value: string;
  previewUrl?: string | null;
  onChange: (next: { id: string; url: string } | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [pending, startTransition] = useTransition();

  const displayUrl =
    previewUrl ||
    (value
      ? recent.find((r) => r.id === value)
        ? mediaPublicUrl(recent.find((r) => r.id === value)!.storageKey)
        : null
      : null);

  useEffect(() => {
    if (!pickerOpen) return;
    startTransition(async () => {
      const result = await listRecentMediaAction(24);
      if (result.ok) setRecent(result.data);
    });
  }, [pickerOpen]);

  async function onFile(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const media = await uploadMediaFile(file);
      onChange({ id: media.id, url: media.url });
      setPickerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>Featured image</Label>
      {displayUrl ? (
        <div className="relative aspect-video overflow-hidden border border-border bg-muted">
          <Image
            src={displayUrl}
            alt="Featured"
            fill
            className="object-cover"
            sizes="400px"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
          No featured image
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload image"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setPickerOpen((v) => !v)}
        >
          {pickerOpen ? "Hide library" : "Pick from library"}
        </Button>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(null)}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {pickerOpen ? (
        <div className="max-h-56 overflow-y-auto border border-border p-2">
          {pending && recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">No uploads yet.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {recent.map((item) => {
                const url = mediaPublicUrl(item.storageKey);
                const selected = item.id === value;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`relative aspect-square w-full overflow-hidden border ${
                        selected
                          ? "border-gvn-navy ring-2 ring-gvn-navy"
                          : "border-border"
                      }`}
                      title={item.originalName}
                      onClick={() => {
                        onChange({ id: item.id, url });
                        setPickerOpen(false);
                      }}
                    >
                      <Image
                        src={url}
                        alt={item.altText || item.originalName}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
