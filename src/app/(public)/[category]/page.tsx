import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import { listByCategory } from "@/server/articles/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const data = await listByCategory(slug, { page: 1 });
  if (!data) return { title: "Category" };
  return {
    title: data.category.nameEn,
    description:
      data.category.description || `${data.category.nameEn} news from GVN`,
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; tab?: string }>;
}) {
  const { category } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  return (
    <CategoryPage
      locale="en"
      categorySlug={category}
      page={page}
      tab={sp.tab}
    />
  );
}
