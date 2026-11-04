import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateArticle } from "@/server/articles/service";
import { isAppError } from "@/lib/errors";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const article = await updateArticle(session.user, id, body);
    return NextResponse.json({ id: article.id, updatedAt: article.updatedAt });
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
