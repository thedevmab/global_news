import { renderArticleHtml } from "@/lib/article-html";

export function ArticleBody({
  body,
  html,
}: {
  body?: unknown;
  html?: string;
}) {
  const safe = html ?? (body !== undefined ? renderArticleHtml(body) : "");
  return <div dangerouslySetInnerHTML={{ __html: safe }} />;
}
