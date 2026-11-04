import { NextResponse } from "next/server";
import { getLocalStorage } from "@/lib/storage";
import { readFile } from "fs/promises";
import path from "path";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await ctx.params;
  const storageKey = parts.map(decodeURIComponent).join("/");
  if (
    storageKey.includes("..") ||
    storageKey.startsWith("/") ||
    storageKey.includes("\\")
  ) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  try {
    const storage = getLocalStorage();
    const absolute = storage.getAbsolutePath(storageKey);
    const buf = await readFile(absolute);
    const ext = path.extname(absolute).toLowerCase();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
