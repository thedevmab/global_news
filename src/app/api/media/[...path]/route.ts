import { NextResponse } from "next/server";
import { getStorage, isRemoteStorageKey } from "@/lib/storage";

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
  if (isRemoteStorageKey(storageKey)) {
    return NextResponse.redirect(storageKey, 302);
  }
  try {
    const { buffer, contentType } = await getStorage().read(storageKey);
    return new NextResponse(buffer, {
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
