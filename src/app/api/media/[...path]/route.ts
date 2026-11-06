import { NextResponse } from "next/server";
import { getStorage, isRemoteStorageKey } from "@/lib/storage";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await ctx.params;
  const storageKey = parts.map(decodeURIComponent).join("/");
  if (
    !storageKey ||
    storageKey.includes("..") ||
    storageKey.startsWith("/") ||
    storageKey.includes("\\") ||
    // Never open-redirect via /media/https://evil.example
    isRemoteStorageKey(storageKey)
  ) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  try {
    const { buffer, contentType } = await getStorage().read(storageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
