import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArticleEditForm } from "@/components/editor/ArticleEditForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const [article, categories, tags] = await Promise.all([
    prisma.article.findFirst({
      where: { id },
      include: {
        tags: true,
        featuredMedia: { select: { storageKey: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, take: 200 }),
  ]);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Edit article</h1>
      <ArticleEditForm
        article={JSON.parse(JSON.stringify(article))}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
