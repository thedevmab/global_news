"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mediaUrl } from "@/lib/media-url";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { FeaturedImagePicker } from "@/components/editor/FeaturedImagePicker";

type Article = {
  id: string;
  headline: string;
  subheadline: string | null;
  slug: string;
  summary: string;
  body: unknown;
  categoryId: string;
  language: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  featuredMediaId: string | null;
  featuredMedia?: { storageKey: string } | null;
  isFeatured: boolean;
  isBreaking: boolean;
  breakingExpiresAt: string | null;
  pinToCategory: boolean;
  hideFromHomepage: boolean;
  tags: { tagId: string }[];
};

export function ArticleEditForm({
  article,
  categories,
  tags,
}: {
  article: Article;
  categories: { id: string; nameEn: string }[];
  tags: { id: string; name: string }[];
}) {
  const [form, setForm] = useState({
    headline: article.headline,
    subheadline: article.subheadline || "",
    slug: article.slug,
    summary: article.summary,
    body: article.body,
    categoryId: article.categoryId,
    language: article.language,
    seoTitle: article.seoTitle || "",
    seoDescription: article.seoDescription || "",
    featuredMediaId: article.featuredMediaId || "",
    isFeatured: article.isFeatured,
    isBreaking: article.isBreaking,
    breakingExpiresAt: article.breakingExpiresAt
      ? article.breakingExpiresAt.slice(0, 16)
      : "",
    pinToCategory: article.pinToCategory,
    hideFromHomepage: article.hideFromHomepage,
    tagIds: article.tags.map((t) => t.tagId),
  });
  const [featuredPreviewUrl, setFeaturedPreviewUrl] = useState<string | null>(
    mediaUrl(article.featuredMedia?.storageKey),
  );
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState(article.status);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          featuredMediaId: form.featuredMediaId || null,
          breakingExpiresAt: form.breakingExpiresAt
            ? new Date(form.breakingExpiresAt).toISOString()
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setDirty(false);
      setMessage("Saved");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [article.id, form]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const id = setInterval(() => {
      void save();
    }, 30000);
    return () => clearInterval(id);
  }, [dirty, save]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function transition(to: string) {
    const reason =
      (to === "DRAFT" && (status === "IN_REVIEW" || status === "PUBLISHED")
        ? window.prompt("Reason (required):") || ""
        : undefined);
    const res = await fetch(`/api/admin/articles/${article.id}/transition`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Transition failed");
      return;
    }
    setStatus(to);
    setMessage(`Moved to ${to}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-muted px-2 py-1 text-xs font-semibold">
          {status}
        </span>
        {dirty ? (
          <span className="text-xs text-amber-600">Unsaved changes</span>
        ) : null}
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {status === "DRAFT" ? (
          <Button type="button" variant="outline" onClick={() => void transition("IN_REVIEW")}>
            Submit for review
          </Button>
        ) : null}
        {status === "IN_REVIEW" ? (
          <>
            <Button type="button" variant="outline" onClick={() => void transition("APPROVED")}>
              Approve
            </Button>
            <Button type="button" variant="ghost" onClick={() => void transition("DRAFT")}>
              Return
            </Button>
          </>
        ) : null}
        {status === "APPROVED" ? (
          <Button type="button" variant="accent" onClick={() => void transition("PUBLISHED")}>
            Publish
          </Button>
        ) : null}
        {status === "PUBLISHED" ? (
          <Button type="button" variant="outline" onClick={() => void transition("DRAFT")}>
            Unpublish
          </Button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Headline</Label>
          <Input
            value={form.headline}
            onChange={(e) => update("headline", e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Subheadline</Label>
          <Input
            value={form.subheadline}
            onChange={(e) => update("subheadline", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <select
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Summary</Label>
          <Textarea
            maxLength={300}
            value={form.summary}
            onChange={(e) => update("summary", e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Body</Label>
          <TipTapEditor
            value={form.body}
            onChange={(json) => update("body", json)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <FeaturedImagePicker
            value={form.featuredMediaId}
            previewUrl={featuredPreviewUrl}
            onChange={(next) => {
              update("featuredMediaId", next?.id ?? "");
              setFeaturedPreviewUrl(next?.url ?? null);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>SEO title</Label>
          <Input
            value={form.seoTitle}
            onChange={(e) => update("seoTitle", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <select
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={form.language}
            onChange={(e) => update("language", e.target.value)}
          >
            <option value="en">English</option>
            <option value="am">Amharic</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>SEO description</Label>
          <Textarea
            value={form.seoDescription}
            onChange={(e) => update("seoDescription", e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => {
              const checked = form.tagIds.includes(t.id);
              return (
                <label
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      update(
                        "tagIds",
                        checked
                          ? form.tagIds.filter((id) => id !== t.id)
                          : [...form.tagIds, t.id],
                      );
                    }}
                  />
                  {t.name}
                </label>
              );
            })}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => update("isFeatured", e.target.checked)}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isBreaking}
            onChange={(e) => update("isBreaking", e.target.checked)}
          />
          Breaking news
        </label>
        <div className="space-y-2">
          <Label>Breaking expiry</Label>
          <Input
            type="datetime-local"
            value={form.breakingExpiresAt}
            onChange={(e) => update("breakingExpiresAt", e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.pinToCategory}
            onChange={(e) => update("pinToCategory", e.target.checked)}
          />
          Pin to category
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.hideFromHomepage}
            onChange={(e) => update("hideFromHomepage", e.target.checked)}
          />
          Hide from homepage
        </label>
      </div>
    </div>
  );
}
