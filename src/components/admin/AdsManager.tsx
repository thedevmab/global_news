"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdSlotKey } from "@prisma/client";
import {
  adCreateAction,
  adDeleteAction,
  adUpdateAction,
} from "@/server/admin/actions";
import { uploadMediaFile } from "@/lib/admin-media-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const PRIMARY_SLOTS: AdSlotKey[] = ["HEADER", "MIDDLE", "FOOTER"];

const SLOT_LABELS: Record<string, string> = {
  HEADER: "Below header",
  MIDDLE: "Middle of page",
  FOOTER: "Above footer",
};

export type AdSlotRow = {
  id: string;
  key: AdSlotKey;
  name: string;
  advertisements: AdRow[];
};

export type AdRow = {
  id: string;
  slotId: string;
  name: string;
  imageUrl: string | null;
  destinationUrl: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

type FormState = {
  id?: string;
  slotId: string;
  name: string;
  imageUrl: string;
  destinationUrl: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

const emptyForm = (slotId = ""): FormState => ({
  slotId,
  name: "",
  imageUrl: "",
  destinationUrl: "",
  isActive: true,
  startsAt: "",
  endsAt: "",
});

export function AdsManager({ slots }: { slots: AdSlotRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);

  const primarySlots = useMemo(
    () =>
      PRIMARY_SLOTS.map((key) => slots.find((s) => s.key === key)).filter(
        (s): s is AdSlotRow => Boolean(s),
      ),
    [slots],
  );

  const defaultSlotId = primarySlots[0]?.id ?? "";

  function openCreate(slotId?: string) {
    setError(null);
    setMessage(null);
    setEditing(emptyForm(slotId || defaultSlotId));
  }

  function openEdit(ad: AdRow) {
    setError(null);
    setMessage(null);
    setEditing({
      id: ad.id,
      slotId: ad.slotId,
      name: ad.name,
      imageUrl: ad.imageUrl ?? "",
      destinationUrl: ad.destinationUrl ?? "",
      isActive: ad.isActive,
      startsAt: ad.startsAt ? ad.startsAt.slice(0, 16) : "",
      endsAt: ad.endsAt ? ad.endsAt.slice(0, 16) : "",
    });
  }

  async function onUpload(file: File | null) {
    if (!file || !editing) return;
    setUploading(true);
    setError(null);
    try {
      const media = await uploadMediaFile(file, { altText: editing.name || "Advertisement" });
      setEditing({ ...editing, imageUrl: media.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!editing.imageUrl.trim()) {
      setError("Upload an advertisement image");
      return;
    }
    if (!editing.slotId) {
      setError("Select a placement slot");
      return;
    }

    setError(null);
    setMessage(null);
    const payload = {
      slotId: editing.slotId,
      name: editing.name.trim(),
      imageUrl: editing.imageUrl.trim(),
      destinationUrl: editing.destinationUrl.trim() || null,
      isActive: editing.isActive,
      startsAt: editing.startsAt ? new Date(editing.startsAt).toISOString() : null,
      endsAt: editing.endsAt ? new Date(editing.endsAt).toISOString() : null,
      scriptHtml: null,
    };

    startTransition(async () => {
      const result = editing.id
        ? await adUpdateAction(editing.id, payload)
        : await adCreateAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(editing.id ? "Advertisement updated." : "Advertisement created.");
      setEditing(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm("Delete this advertisement permanently?")) return;
    setError(null);
    startTransition(async () => {
      const result = await adDeleteAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Advertisement deleted.");
      if (editing?.id === id) setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Upload image ads for below header, middle of page, and above footer.
        </p>
        <Button type="button" onClick={() => openCreate()} disabled={pending}>
          New advertisement
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-gvn-red" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
          {message}
        </p>
      ) : null}

      {editing ? (
        <div className="space-y-4 border border-border bg-card p-4">
          <h2 className="font-serif text-lg font-semibold">
            {editing.id ? "Edit advertisement" : "New advertisement"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ad-name">Name</Label>
              <Input
                id="ad-name"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-slot">Placement</Label>
              <select
                id="ad-slot"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={editing.slotId}
                onChange={(e) =>
                  setEditing({ ...editing, slotId: e.target.value })
                }
              >
                {primarySlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {SLOT_LABELS[slot.key] ?? slot.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ad-image">Advertisement image</Label>
              <Input
                id="ad-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading || pending}
                onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
              />
              {editing.imageUrl ? (
                <div className="mt-2 overflow-hidden rounded-md border border-border bg-muted/30 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editing.imageUrl}
                    alt={editing.name || "Preview"}
                    className="mx-auto max-h-40 w-auto object-contain"
                  />
                </div>
              ) : null}
              {uploading ? (
                <p className="text-xs text-muted-foreground">Uploading…</p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ad-dest">Click-through URL</Label>
              <Input
                id="ad-dest"
                type="url"
                placeholder="https://…"
                value={editing.destinationUrl}
                onChange={(e) =>
                  setEditing({ ...editing, destinationUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-start">Starts at (optional)</Label>
              <Input
                id="ad-start"
                type="datetime-local"
                value={editing.startsAt}
                onChange={(e) =>
                  setEditing({ ...editing, startsAt: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-end">Ends at (optional)</Label>
              <Input
                id="ad-end"
                type="datetime-local"
                value={editing.endsAt}
                onChange={(e) =>
                  setEditing({ ...editing, endsAt: e.target.value })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) =>
                  setEditing({ ...editing, isActive: e.target.checked })
                }
              />
              Active
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={pending || uploading}>
              {editing.id ? "Save changes" : "Create advertisement"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-8">
        {primarySlots.map((slot) => (
          <section key={slot.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold">
                {SLOT_LABELS[slot.key] ?? slot.name}
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openCreate(slot.id)}
                disabled={pending}
              >
                Add to this slot
              </Button>
            </div>
            {slot.advertisements.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No advertisements in this slot yet.
              </p>
            ) : (
              <div className="overflow-x-auto border border-border bg-background">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-3 py-2">Preview</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Link</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slot.advertisements.map((ad) => (
                      <tr
                        key={ad.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-3 py-2">
                          {ad.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ad.imageUrl}
                              alt=""
                              className="h-12 w-24 object-contain"
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">{ad.name}</td>
                        <td className="px-3 py-2 max-w-[14rem] truncate text-muted-foreground">
                          {ad.destinationUrl || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={ad.isActive ? "success" : "muted"}>
                            {ad.isActive ? "Active" : "Off"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => openEdit(ad)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={pending}
                              onClick={() => remove(ad.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
