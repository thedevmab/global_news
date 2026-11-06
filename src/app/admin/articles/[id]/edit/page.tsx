import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { mediaUrl } from "@/lib/media-url";
import { ArticleEditor } from "@/components/editor/ArticleEditor";

export const metadata = { title: "Edit article" };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (
    !hasPermission(user.role, "article:edit_own") &&
    !hasPermission(user.role, "article:edit_any")
  ) {
    redirect("/admin");
  }

  const { id } = await params;
  const [article, categories, tags] = await Promise.all([
    prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: {
        tags: true,
        featuredMedia: { select: { storageKey: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!article) notFound();

  return (
    <ArticleEditor
      mode="edit"
      articleId={article.id}
      initial={{
        headline: article.headline,
        body: article.body,
        categoryId: article.categoryId,
        tagIds: article.tags.map((t) => t.tagId),
        language: article.language,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        featuredMediaId: article.featuredMediaId,
        featuredMediaUrl: mediaUrl(article.featuredMedia?.storageKey),
        isFeatured: article.isFeatured,
        isBreaking: article.isBreaking,
        breakingExpiresAt: article.breakingExpiresAt?.toISOString() ?? null,
        pinToCategory: article.pinToCategory,
        hideFromHomepage: article.hideFromHomepage,
        scheduledAt: article.scheduledAt?.toISOString() ?? null,
        status: article.status,
      }}
      categories={categories.map((c) => ({ id: c.id, label: c.nameEn }))}
      tags={tags.map((t) => ({ id: t.id, label: t.name }))}
      canPublish={hasPermission(user.role, "article:publish")}
      canManageBreaking={hasPermission(user.role, "article:manage_breaking")}
    />
  );
}
