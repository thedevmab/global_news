import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArticleBody } from "@/components/article/ArticleBody";
import { localePath } from "@/i18n";
import { getPublishedStaticPage } from "@/server/articles/public";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "about") redirect(localePath("am", "/about"));
  const page =
    (await getPublishedStaticPage(slug, "am")) ||
    (await getPublishedStaticPage(slug, "en"));
  if (!page) return { title: "ገጽ" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (slug === "about") redirect(localePath("am", "/about"));
  const page =
    (await getPublishedStaticPage(slug, "am")) ||
    (await getPublishedStaticPage(slug, "en"));
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl font-semibold md:text-4xl">
        {page.title}
      </h1>
      <ArticleBody body={page.body} />
    </div>
  );
}
