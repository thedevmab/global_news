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
import { AdminTable } from "@/components/admin/AdminTable";
import { ArticleRowActions } from "@/components/admin/ArticleRowActions";

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
  const canTrash = hasPermission(user.role, "article:trash");

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
        <h1 className="min-w-0 font-serif text-2xl font-semibold">Articles</h1>
        {hasPermission(user.role, "article:create") ? (
          <Link
            href="/admin/articles/new"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-gvn-navy px-4 text-sm font-semibold text-white hover:bg-gvn-deep-navy"
          >
            New article
          </Link>
        ) : null}
      </div>

      <form className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search…"
          className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm sm:w-auto sm:min-w-[12rem]"
        />
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:contents">
          <select
            name="status"
            defaultValue={sp.status || ""}
            className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm sm:w-auto"
          >
            <option value="">All statuses</option>
            {Object.values(ArticleStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="min-h-10 sm:w-auto">
            Filter
          </Button>
        </div>
      </form>

      <ArticlesBulkForm canTrash={canTrash}>
        {/* Mobile compact cards */}
        <ul className="space-y-3 md:hidden">
          {data.items.map((a) => (
            <li
              key={a.id}
              className="rounded-md border border-border bg-background p-3"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="ids"
                  value={a.id}
                  className="mt-1 h-4 w-4 shrink-0"
                  aria-label={`Select ${a.headline}`}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="break-words text-sm font-semibold leading-snug hover:text-gvn-red"
                    >
                      {a.headline}
                    </Link>
                    <Badge variant="muted" className="shrink-0">
                      {a.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.author.name}
                    <span aria-hidden="true"> · </span>
                    {a.category.nameEn}
                    <span aria-hidden="true"> · </span>
                    {format(a.updatedAt, "MMM d, yyyy")}
                    <span aria-hidden="true"> · </span>
                    {a.viewCount} views
                  </p>
                  <ArticleRowActions articleId={a.id} canTrash={canTrash} />
                </div>
              </div>
            </li>
          ))}
          {data.items.length === 0 ? (
            <li className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No articles found.
            </li>
          ) : null}
        </ul>

        {/* Desktop table */}
        <div className="hidden md:block">
          <AdminTable>
            <thead>
              <tr>
                <th className="w-10" />
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <input
                      type="checkbox"
                      name="ids"
                      value={a.id}
                      aria-label={`Select ${a.headline}`}
                    />
                  </td>
                  <td>
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="break-words font-medium hover:text-gvn-red"
                    >
                      {a.headline}
                    </Link>
                  </td>
                  <td>{a.author.name}</td>
                  <td>{a.category.nameEn}</td>
                  <td>
                    <Badge variant="muted">{a.status}</Badge>
                  </td>
                  <td>{format(a.updatedAt, "yyyy-MM-dd HH:mm")}</td>
                  <td>{a.viewCount}</td>
                  <td className="admin-table-actions">
                    <ArticleRowActions articleId={a.id} canTrash={canTrash} />
                  </td>
                </tr>
              ))}
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    No articles found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </AdminTable>
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
