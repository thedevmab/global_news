import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImage } from "@/server/media/service";
import { isAppError } from "@/lib/errors";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
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
