"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArticleStatus } from "@prisma/client";
import { bulkArticlesAction } from "@/server/articles/actions";
import { Button } from "@/components/ui/button";

export function ArticlesBulkForm({
  children,
  canTrash,
}: {
  children: React.ReactNode;
  canTrash?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ids = fd.getAll("ids").map(String).filter(Boolean);
    const to = String(fd.get("bulkTo") || "") as ArticleStatus;
    if (!ids.length || !to) return;
    startTransition(async () => {
      await bulkArticlesAction({ ids, to });
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="bulkTo"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Bulk action…
          </option>
          <option value="IN_REVIEW">Submit review</option>
          <option value="DRAFT">Return to draft</option>
          {canTrash ? <option value="TRASH">Move to trash</option> : null}
        </select>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Working…" : "Apply"}
        </Button>
      </div>
      {children}
    </form>
  );
}
