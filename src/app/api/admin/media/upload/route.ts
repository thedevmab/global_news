import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MAX_BYTES, uploadImage } from "@/server/media/service";
import { isAppError } from "@/lib/errors";

const MAX_CONTENT_LENGTH = MAX_BYTES + 64 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const size = Number(contentLength);
    if (Number.isFinite(size) && size > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: "Image exceeds 5MB limit" },
        { status: 413 },
      );
    }
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds 5MB limit" },
        { status: 413 },
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const media = await uploadImage(
      session.user,
      { buffer, originalName: file.name },
      {
        altText: String(form.get("altText") || "") || undefined,
        caption: String(form.get("caption") || "") || undefined,
        credit: String(form.get("credit") || "") || undefined,
      },
    );
    return NextResponse.json(media);
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error(err);
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
