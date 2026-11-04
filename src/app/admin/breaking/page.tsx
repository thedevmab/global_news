import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { listBreakingNews } from "@/server/homepage/service";
import {
  breakingCreateAction,
  breakingDeleteAction,
} from "@/server/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const metadata = { title: "Breaking news" };

export default async function BreakingAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    requirePermission(user, "article:manage_breaking");
  } catch {
    redirect("/admin");
  }

  const [items, articles] = await Promise.all([
    listBreakingNews(),
    prisma.article.findMany({
      where: { deletedAt: null, status: { in: ["PUBLISHED", "APPROVED"] } },
      orderBy: { updatedAt: "desc" },
      take: 80,
      select: { id: true, headline: true },
    }),
  ]);

  async function createAction(formData: FormData) {
    "use server";
    await breakingCreateAction({
      articleId: String(formData.get("articleId") || ""),
      label: String(formData.get("label") || "") || null,
      expiresAt: String(formData.get("expiresAt") || "") || null,
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold">Breaking news</h1>

      <form action={createAction} className="grid gap-3 border border-border bg-background p-4 md:grid-cols-3">
        <select
          name="articleId"
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm md:col-span-2"
        >
          <option value="">Select article…</option>
          {articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.headline}
            </option>
          ))}
        </select>
        <Input name="label" placeholder="Ticker label (optional)" />
        <Input name="expiresAt" type="datetime-local" />
        <Button type="submit" className="md:w-fit">
          Add breaking item
        </Button>
      </form>

      <ul className="divide-y divide-border border border-border bg-background">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">
                {item.label || item.article?.headline || item.articleId}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.isActive ? "Active" : "Inactive"}
                {item.expiresAt
                  ? ` · expires ${format(item.expiresAt, "PPp")}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={item.isActive ? "accent" : "muted"}>
                {item.isActive ? "Live" : "Off"}
              </Badge>
              <form
                action={async () => {
                  "use server";
                  await breakingDeleteAction(item.id);
                }}
              >
                <Button type="submit" size="sm" variant="destructive">
                  Remove
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
