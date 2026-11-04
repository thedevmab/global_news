"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";

type Category = { id: string; nameEn: string; slug: string };

export function ArticleCreateForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [headline, setHeadline] = useState("");
  const [slug, setSlug] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          headline: form.get("headline"),
          slug: form.get("slug") || slugify(String(form.get("headline") || "")),
          summary: form.get("summary"),
          categoryId: form.get("categoryId"),
          language: form.get("language") || "en",
          body: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: String(form.get("bodyText") || "") }],
              },
            ],
          },
          tagIds: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      router.push(`/admin/articles/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          required
          value={headline}
          onChange={(e) => {
            setHeadline(e.target.value);
            setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Summary (max 300)</Label>
        <Textarea id="summary" name="summary" required maxLength={300} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            required
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <select
            id="language"
            name="language"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            defaultValue="en"
          >
            <option value="en">English</option>
            <option value="am">Amharic</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bodyText">Body (plain start — rich editor on next screen)</Label>
        <Textarea id="bodyText" name="bodyText" rows={8} required />
      </div>
      {error ? (
        <p className="text-sm text-gvn-red" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}
