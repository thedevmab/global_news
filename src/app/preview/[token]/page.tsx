import { notFound } from "next/navigation";
import { getArticleByPreviewToken } from "@/server/articles/service";
import { Badge } from "@/components/ui/badge";
import { ArticleBody } from "@/components/article/ArticleBody";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Preview",
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let article;
  try {
    article = await getArticleByPreviewToken(token);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <Badge variant="warning">Preview</Badge>
        <Badge variant="muted">{article.status}</Badge>
        <span className="text-xs text-muted-foreground">
          Not publicly indexed · token expires in 24h
        </span>
      </div>
      <p className="text-sm font-semibold uppercase tracking-wide text-gvn-red">
        {article.category.nameEn}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-gvn-navy dark:text-white">
        {article.headline}
      </h1>
      {article.subheadline ? (
        <p className="mt-3 text-lg text-muted-foreground">{article.subheadline}</p>
      ) : null}
      <p className="mt-4 text-sm text-muted-foreground">
        By {article.author.name}
      </p>
      {article.summary ? (
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          {article.summary}
        </p>
      ) : null}
      <div className="prose-article mt-8">
        <ArticleBody body={article.body} />
      </div>
    </main>
  );
}
