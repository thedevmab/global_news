import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { transitionArticle } from "@/server/articles/service";
import { isAppError } from "@/lib/errors";

export async function POST(
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
    const article = await transitionArticle(session.user, {
      ...body,
      articleId: id,
    });
    return NextResponse.json({ id: article.id, status: article.status });
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Transition failed" }, { status: 400 });
  }
}
