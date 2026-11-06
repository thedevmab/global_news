import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { getHomepageLayout } from "@/server/homepage/service";
import {
  HomepageLayoutForm,
  type HomepageArticleOption,
} from "@/components/admin/HomepageLayoutForm";

export const metadata = { title: "Homepage" };

export default async function AdminHomepagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/homepage");
  if (!hasPermission(user.role, "homepage:manage")) redirect("/admin");

  const [slots, published] = await Promise.all([
    getHomepageLayout(),
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        publishedAt: { lte: new Date() },
        hideFromHomepage: false,
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: 80,
      select: {
        id: true,
        headline: true,
        language: true,
        publishedAt: true,
        category: { select: { nameEn: true } },
      },
    }),
  ]);

  const lead = slots.find((s) => s.type === "LEAD") ?? null;
  const secondary = slots
    .filter((s) => s.type === "SECONDARY")
    .sort((a, b) => a.position - b.position);

  const articles: HomepageArticleOption[] = published.map((a) => ({
    id: a.id,
    headline: a.headline,
    language: a.language,
    categoryName: a.category.nameEn,
    publishedAt: a.publishedAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Homepage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control what appears in the public hero and Top Stories. Publish
          articles from Articles first — only published stories can be featured.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No published articles yet.{" "}
          <a href="/admin/articles/new" className="text-gvn-red hover:underline">
            Create and publish
          </a>{" "}
          an article, then return here.
        </p>
      ) : (
        <HomepageLayoutForm
          articles={articles}
          initialLeadId={lead?.articleId ?? null}
          initialSecondaryIds={secondary.map((s) => s.articleId)}
        />
      )}
    </div>
  );
}
