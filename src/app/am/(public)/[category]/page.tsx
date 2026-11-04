import type { Metadata } from "next";
import { CategoryPage } from "@/components/public/CategoryPage";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
  });
  if (!category) return { title: "ምድብ" };
  return {
    title: category.nameAm || category.nameEn,
    description: category.description || undefined,
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { category } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  return (
    <CategoryPage
      locale="am"
      categorySlug={category}
      page={page}
      tab={sp.tab}
    />
  );
}
