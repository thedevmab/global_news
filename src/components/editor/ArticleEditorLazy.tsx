"use client";

import dynamic from "next/dynamic";
import type { ArticleEditorProps } from "@/components/editor/ArticleEditor";

const ArticleEditor = dynamic(
  () =>
    import("@/components/editor/ArticleEditor").then((m) => ({
      default: m.ArticleEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse rounded-md border border-border bg-muted/40 p-8 text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
);

export function ArticleEditorLazy(props: ArticleEditorProps) {
  return <ArticleEditor {...props} />;
}
