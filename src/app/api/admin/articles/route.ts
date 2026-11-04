import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createArticle } from "@/server/articles/service";
import { isAppError } from "@/lib/errors";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const article = await createArticle(session.user, body);
    return NextResponse.json({ id: article.id, slug: article.slug });
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Create failed" }, { status: 400 });
  }
}
