import type { Metadata } from "next";
import { ArticlePageView } from "@/components/public/ArticlePage";
import { getPublishedArticleBySlug } from "@/server/articles/public";
import { excerpt } from "@/lib/utils";

type Props = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getPublishedArticleBySlug(category, slug, "am");
  if (!article) return { title: "ጽሁፍ" };
  return {
    title: article.seoTitle || article.headline,
    description: article.seoDescription || excerpt(article.summary, 160),
  };
}

export default async function Page({ params }: Props) {
  const { category, slug } = await params;
  return (
    <ArticlePageView locale="am" categorySlug={category} slug={slug} />
  );
}
