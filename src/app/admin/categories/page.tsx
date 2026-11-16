import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { listCategories } from "@/server/categories/service";
import {
  CategoriesManager,
  type CategoryRow,
} from "@/components/admin/CategoriesManager";

export const metadata = { title: "Categories" };

export default async function CategoriesAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    requirePermission(user, "category:manage");
  } catch {
    redirect("/admin");
  }

  const categories = await listCategories();
  const items: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    nameEn: c.nameEn,
    nameAm: c.nameAm,
    slug: c.slug,
    description: c.description,
    color: c.color,
    parentId: c.parentId,
    parentName: c.parent?.nameEn ?? null,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    articleCount: c._count.articles,
  }));

  return <CategoriesManager items={items} />;
}
