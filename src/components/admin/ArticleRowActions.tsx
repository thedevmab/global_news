"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { bulkArticlesAction } from "@/server/articles/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ArticleRowActions({
  articleId,
  canTrash,
}: {
  articleId: string;
  canTrash: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function trash() {
    if (!canTrash) return;
    if (!window.confirm("Move this article to trash?")) return;
    startTransition(async () => {
      await bulkArticlesAction({ ids: [articleId], to: "TRASH" });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/admin/articles/${articleId}/edit`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
      >
        Edit
      </Link>
      {canTrash ? (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="min-h-10"
          disabled={pending}
          onClick={trash}
        >
          {pending ? "Deleting…" : "Delete"}
        </Button>
      ) : null}
    </div>
  );
}
