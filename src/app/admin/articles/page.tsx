import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ArticleStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { listAdminArticles } from "@/server/articles/service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { ArticlesBulkForm } from "@/components/admin/ArticlesBulkForm";

export const metadata = { title: "Articles" };

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const status = sp.status ? (sp.status as ArticleStatus) : undefined;
  const data = await listAdminArticles({
    user,
    q: sp.q,
    status,
    page: Number(sp.page || "1"),
  });

  const hrefForPage = (page: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.status) params.set("status", sp.status);
    params.set("page", String(page));
    return `/admin/articles?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-semibold">Articles</h1>
        {hasPermission(user.role, "article:create") ? (
          <Link
            href="/admin/articles/new"
            className="inline-flex h-10 items-center justify-center rounded-md bg-gvn-navy px-4 text-sm font-semibold text-white hover:bg-gvn-deep-navy"
          >
            New article
          </Link>
        ) : null}
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search…"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={sp.status || ""}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.values(ArticleStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <ArticlesBulkForm canTrash={hasPermission(user.role, "article:trash")}>
        <div className="overflow-x-auto border border-border bg-background">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2 w-10" />
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Author</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Views</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <input type="checkbox" name="ids" value={a.id} />
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="font-medium hover:text-gvn-red"
                    >
                      {a.headline}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{a.author.name}</td>
                  <td className="px-3 py-2">{a.category.nameEn}</td>
                  <td className="px-3 py-2">
                    <Badge variant="muted">{a.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    {format(a.updatedAt, "yyyy-MM-dd HH:mm")}
                  </td>
                  <td className="px-3 py-2">{a.viewCount}</td>
                </tr>
              ))}
              {data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    No articles found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </ArticlesBulkForm>

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        hrefForPage={hrefForPage}
      />
    </div>
  );
}
