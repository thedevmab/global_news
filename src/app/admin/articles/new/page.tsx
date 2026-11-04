import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { ArticleEditor } from "@/components/editor/ArticleEditor";

export const metadata = { title: "New article" };

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.role, "article:create")) redirect("/admin");

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ArticleEditor
      mode="create"
      categories={categories.map((c) => ({ id: c.id, label: c.nameEn }))}
      tags={tags.map((t) => ({ id: t.id, label: t.name }))}
      canPublish={hasPermission(user.role, "article:publish")}
      canManageBreaking={hasPermission(user.role, "article:manage_breaking")}
    />
  );
}
