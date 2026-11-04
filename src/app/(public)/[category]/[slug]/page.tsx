import type { Metadata } from "next";
import { ArticlePageView } from "@/components/public/ArticlePage";
import { getPublishedArticleBySlug } from "@/server/articles/public";
import { absoluteUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getPublishedArticleBySlug(category, slug);
  if (!article) return { title: "Not found" };
  const url = absoluteUrl(`/${category}/${slug}`);
  return {
    title: article.seoTitle || article.headline,
    description: article.seoDescription || article.summary,
    alternates: { canonical: url },
    openGraph: {
      title: article.headline,
      description: article.summary,
      type: "article",
      url,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  return <ArticlePageView locale="en" categorySlug={category} slug={slug} />;
}
