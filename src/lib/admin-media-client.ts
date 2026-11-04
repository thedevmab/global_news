import { mediaPublicUrl } from "@/lib/media-url";

export type UploadedMedia = {
  id: string;
  storageKey: string;
  url: string;
  altText: string | null;
};

/** Upload an image file to the admin media API. Returns media id + public URL. */
export async function uploadMediaFile(
  file: File,
  meta?: { altText?: string; caption?: string; credit?: string },
): Promise<UploadedMedia> {
  const fd = new FormData();
  fd.append("file", file);
  if (meta?.altText) fd.append("altText", meta.altText);
  if (meta?.caption) fd.append("caption", meta.caption);
  if (meta?.credit) fd.append("credit", meta.credit);

  const res = await fetch("/api/admin/media/upload", {
    method: "POST",
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return {
    id: data.id as string,
    storageKey: data.storageKey as string,
    url: mediaPublicUrl(data.storageKey as string),
    altText: (data.altText as string | null) ?? null,
  };
}
