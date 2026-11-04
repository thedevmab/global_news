import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArticleBody } from "@/components/article/ArticleBody";
import { localePath } from "@/i18n";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "about") redirect(localePath("en", "/about"));
  const page = await prisma.staticPage.findFirst({
    where: { slug, published: true },
  });
  if (!page) return { title: "Page" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "about") redirect(localePath("en", "/about"));
  const page = await prisma.staticPage.findFirst({
    where: { slug, published: true },
  });
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-serif text-4xl font-bold text-gvn-navy dark:text-white">
        {page.title}
      </h1>
      <div className="prose-article">
        <ArticleBody body={page.body} />
      </div>
    </div>
  );
}
