import { NextResponse } from "next/server";
import { ContentLanguage } from "@prisma/client";
import { listLatestArticles } from "@/server/articles/public";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Number(url.searchParams.get("pageSize") || "12");
  const languageParam = url.searchParams.get("language");
  const language =
    languageParam === "am" || languageParam === "en"
      ? (languageParam as ContentLanguage)
      : undefined;
  const exclude = url.searchParams.getAll("exclude").filter(Boolean);

  const result = await listLatestArticles({
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 12,
    language,
    excludeIds: exclude,
  });

  return NextResponse.json(result);
}
