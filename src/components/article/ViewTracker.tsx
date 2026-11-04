"use client";

import { useEffect } from "react";

export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `gvn_view_${articleId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ articleId }),
    });
  }, [articleId]);
  return null;
}
