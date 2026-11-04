import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { listRevisions } from "@/server/articles/service";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Revisions" };

export default async function ArticleRevisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  let revisions;
  try {
    revisions = await listRevisions(user, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-semibold">Revisions</h1>
        <Link
          href={`/admin/articles/${id}/edit`}
          className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
        >
          Back to editor
        </Link>
      </div>

      {revisions.length === 0 ? (
        <EmptyState title="No revisions yet" />
      ) : (
        <ul className="divide-y divide-border border border-border bg-background">
          {revisions.map((rev) => (
            <li key={rev.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {rev.editor.name}
                    {rev.note ? (
                      <span className="text-muted-foreground"> · {rev.note}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(rev.createdAt, "PPpp")}
                  </p>
                </div>
                <details className="w-full sm:w-auto">
                  <summary className="cursor-pointer text-xs font-semibold text-gvn-red">
                    View snapshot
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded border border-border bg-muted/40 p-3 text-xs">
                    {JSON.stringify(rev.snapshot, null, 2)}
                  </pre>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
