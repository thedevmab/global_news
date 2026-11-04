"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Youtube from "@tiptap/extension-youtube";
import { ContentLanguage, type ArticleStatus } from "@prisma/client";
import { uploadMediaFile } from "@/lib/admin-media-client";
import { slugify } from "@/lib/utils";
import { EMPTY_DOC } from "@/lib/tiptap-text";
import {
  autosaveArticleAction,
  createArticleAction,
  createPreviewTokenAction,
  transitionArticleAction,
  updateArticleAction,
} from "@/server/articles/actions";
import { FeaturedImagePicker } from "@/components/editor/FeaturedImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string };

export type ArticleEditorProps = {
  mode: "create" | "edit";
  articleId?: string;
  initial?: {
    headline: string;
    subheadline: string | null;
    slug: string;
    summary: string;
    body: unknown;
    categoryId: string;
    tagIds: string[];
    language: ContentLanguage;
    seoTitle: string | null;
    seoDescription: string | null;
    featuredMediaId: string | null;
    featuredMediaUrl?: string | null;
    isFeatured: boolean;
    isBreaking: boolean;
    breakingExpiresAt: string | null;
    pinToCategory: boolean;
    hideFromHomepage: boolean;
    scheduledAt: string | null;
    status: ArticleStatus;
  };
  categories: Option[];
  tags: Option[];
  canPublish?: boolean;
  canManageBreaking?: boolean;
};

export function ArticleEditor({
  mode,
  articleId,
  initial,
  categories,
  tags,
  canPublish,
  canManageBreaking,
}: ArticleEditorProps) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [subheadline, setSubheadline] = useState(initial?.subheadline ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? "",
  );
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [language, setLanguage] = useState<ContentLanguage>(
    initial?.language ?? ContentLanguage.en,
  );
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initial?.seoDescription ?? "",
  );
  const [featuredMediaId, setFeaturedMediaId] = useState(
    initial?.featuredMediaId ?? "",
  );
  const [featuredMediaUrl, setFeaturedMediaUrl] = useState(
    initial?.featuredMediaUrl ?? null,
  );
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isBreaking, setIsBreaking] = useState(initial?.isBreaking ?? false);
  const [breakingExpiresAt, setBreakingExpiresAt] = useState(
    initial?.breakingExpiresAt
      ? initial.breakingExpiresAt.slice(0, 16)
      : "",
  );
  const [pinToCategory, setPinToCategory] = useState(
    initial?.pinToCategory ?? false,
  );
  const [hideFromHomepage, setHideFromHomepage] = useState(
    initial?.hideFromHomepage ?? false,
  );
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduledAt ? initial.scheduledAt.slice(0, 16) : "",
  );
  const [status, setStatus] = useState<ArticleStatus>(initial?.status ?? "DRAFT");
  const [dirty, setDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Write the story…" }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ width: 640, height: 360 }),
    ],
    content: (initial?.body as object) || EMPTY_DOC,
    immediatelyRender: false,
    onUpdate: () => {
      dirtyRef.current = true;
      setDirty(true);
    },
  });

  useEffect(() => {
    if (!slugTouched && headline) {
      setSlug(slugify(headline));
    }
  }, [headline, slugTouched]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const payload = useCallback(() => {
    return {
      headline,
      subheadline: subheadline || null,
      slug,
      summary,
      body: editor?.getJSON() ?? EMPTY_DOC,
      categoryId,
      tagIds,
      language,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      featuredMediaId: featuredMediaId || null,
      isFeatured,
      isBreaking,
      breakingExpiresAt: breakingExpiresAt
        ? new Date(breakingExpiresAt).toISOString()
        : null,
      pinToCategory,
      hideFromHomepage,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };
  }, [
    headline,
    subheadline,
    slug,
    summary,
    editor,
    categoryId,
    tagIds,
    language,
    seoTitle,
    seoDescription,
    featuredMediaId,
    isFeatured,
    isBreaking,
    breakingExpiresAt,
    pinToCategory,
    hideFromHomepage,
    scheduledAt,
  ]);

  useEffect(() => {
    if (mode !== "edit" || !articleId) return;
    const timer = setInterval(() => {
      if (!dirtyRef.current) return;
      void (async () => {
        const result = await autosaveArticleAction(articleId, payload());
        if (result.ok) {
          dirtyRef.current = false;
          setDirty(false);
          setSaveMsg(`Autosaved ${new Date().toLocaleTimeString()}`);
        }
      })();
    }, 30_000);
    return () => clearInterval(timer);
  }, [mode, articleId, payload]);

  const markDirty = () => {
    dirtyRef.current = true;
    setDirty(true);
  };

  function save() {
    setError(null);
    startTransition(async () => {
      if (mode === "create") {
        const result = await createArticleAction(payload());
        if (!result.ok) {
          setError(result.error || "Create failed");
          return;
        }
        dirtyRef.current = false;
        setDirty(false);
        router.push(`/admin/articles/${result.data.id}/edit`);
        return;
      }
      if (!articleId) return;
      const result = await updateArticleAction(articleId, payload());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      dirtyRef.current = false;
      setDirty(false);
      setSaveMsg(`Saved ${new Date().toLocaleTimeString()}`);
      router.refresh();
    });
  }

  function transition(to: ArticleStatus, reason?: string) {
    if (!articleId) return;
    setError(null);
    startTransition(async () => {
      await updateArticleAction(articleId, payload());
      const result = await transitionArticleAction({
        articleId,
        to,
        reason,
        scheduledAt: scheduledAt || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatus(result.data.status);
      dirtyRef.current = false;
      setDirty(false);
      router.refresh();
    });
  }

  async function preview() {
    if (!articleId) return;
    const result = await createPreviewTokenAction(articleId);
    if (result.ok) window.open(result.data.url, "_blank");
    else setError(result.error);
  }

  async function insertBodyImage(file: File | null) {
    if (!file || !editor) return;
    setImageUploading(true);
    setError(null);
    try {
      const media = await uploadMediaFile(file);
      editor
        .chain()
        .focus()
        .setImage({ src: media.url, alt: media.altText || undefined })
        .run();
      dirtyRef.current = true;
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setImageUploading(false);
      if (imageFileRef.current) imageFileRef.current.value = "";
    }
  }

  const toolbar = useMemo(
    () => (
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2">
        {[
          { label: "B", action: () => editor?.chain().focus().toggleBold().run() },
          { label: "I", action: () => editor?.chain().focus().toggleItalic().run() },
          { label: "H2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
          { label: "H3", action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
          { label: "Quote", action: () => editor?.chain().focus().toggleBlockquote().run() },
          { label: "List", action: () => editor?.chain().focus().toggleBulletList().run() },
          {
            label: "Link",
            action: () => {
              const url = window.prompt("URL");
              if (!url) return;
              editor?.chain().focus().setLink({ href: url }).run();
            },
          },
          {
            label: imageUploading ? "…" : "Image",
            action: () => {
              if (imageUploading) return;
              imageFileRef.current?.click();
            },
          },
          {
            label: "YouTube",
            action: () => {
              const url = window.prompt("YouTube URL");
              if (!url) return;
              editor?.chain().focus().setYoutubeVideo({ src: url }).run();
            },
          },
          {
            label: "Table",
            action: () =>
              editor
                ?.chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run(),
          },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            className="rounded border border-border bg-background px-2 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50"
            onClick={btn.action}
            disabled={btn.label === "…" || (btn.label === "Image" && imageUploading)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    ),
    [editor, imageUploading],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl font-semibold">
            {mode === "create" ? "New article" : "Edit article"}
          </h1>
          <Badge variant="muted">{status.replace("_", " ")}</Badge>
          {dirty ? <Badge variant="warning">Unsaved</Badge> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {articleId ? (
            <>
              <Button type="button" variant="outline" onClick={preview}>
                Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/articles/${articleId}/revisions`)}
              >
                Revisions
              </Button>
              {status === "DRAFT" ? (
                <Button type="button" onClick={() => transition("IN_REVIEW")}>
                  Submit review
                </Button>
              ) : null}
              {status === "IN_REVIEW" ? (
                <>
                  <Button type="button" onClick={() => transition("APPROVED")}>
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const reason = window.prompt("Return reason");
                      if (reason) transition("DRAFT", reason);
                    }}
                  >
                    Return
                  </Button>
                </>
              ) : null}
              {canPublish && (status === "APPROVED" || status === "SCHEDULED") ? (
                <Button type="button" variant="accent" onClick={() => transition("PUBLISHED")}>
                  Publish
                </Button>
              ) : null}
              {canPublish && status === "APPROVED" && scheduledAt ? (
                <Button type="button" onClick={() => transition("SCHEDULED")}>
                  Schedule
                </Button>
              ) : null}
            </>
          ) : null}
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {saveMsg ? (
        <p className="text-xs text-muted-foreground">{saveMsg}</p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => {
                setHeadline(e.target.value);
                markDirty();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subheadline">Subheadline</Label>
            <Input
              id="subheadline"
              value={subheadline}
              onChange={(e) => {
                setSubheadline(e.target.value);
                markDirty();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary (max 300)</Label>
            <Textarea
              id="summary"
              maxLength={300}
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                markDirty();
              }}
            />
            <p className="text-xs text-muted-foreground">{summary.length}/300</p>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <input
              ref={imageFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void insertBodyImage(e.target.files?.[0] ?? null)}
            />
            {toolbar}
            <EditorContent
              editor={editor}
              className="prose-article min-h-[360px] px-4 py-3 focus-within:outline-none [&_.tiptap]:min-h-[340px] [&_.tiptap]:outline-none"
            />
          </div>
        </div>

        <aside className="space-y-4 border border-border bg-background p-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value) || e.target.value);
                markDirty();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                markDirty();
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-border p-2">
              {tags.map((t) => {
                const checked = tagIds.includes(t.id);
                return (
                  <label key={t.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setTagIds((prev) =>
                          checked
                            ? prev.filter((id) => id !== t.id)
                            : [...prev, t.id],
                        );
                        markDirty();
                      }}
                    />
                    {t.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as ContentLanguage);
                markDirty();
              }}
            >
              <option value="en">English</option>
              <option value="am">Amharic</option>
            </select>
          </div>
          <FeaturedImagePicker
            value={featuredMediaId}
            previewUrl={featuredMediaUrl}
            onChange={(next) => {
              setFeaturedMediaId(next?.id ?? "");
              setFeaturedMediaUrl(next?.url ?? null);
              markDirty();
            }}
          />
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input
              id="seoTitle"
              maxLength={70}
              value={seoTitle}
              onChange={(e) => {
                setSeoTitle(e.target.value);
                markDirty();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoDescription">SEO description</Label>
            <Textarea
              id="seoDescription"
              maxLength={160}
              value={seoDescription}
              onChange={(e) => {
                setSeoDescription(e.target.value);
                markDirty();
              }}
            />
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => {
                  setIsFeatured(e.target.checked);
                  markDirty();
                }}
              />
              Featured
            </label>
            {canManageBreaking ? (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => {
                      setIsBreaking(e.target.checked);
                      markDirty();
                    }}
                  />
                  Breaking
                </label>
                {isBreaking ? (
                  <Input
                    type="datetime-local"
                    value={breakingExpiresAt}
                    onChange={(e) => {
                      setBreakingExpiresAt(e.target.value);
                      markDirty();
                    }}
                  />
                ) : null}
              </>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pinToCategory}
                onChange={(e) => {
                  setPinToCategory(e.target.checked);
                  markDirty();
                }}
              />
              Pin to category
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hideFromHomepage}
                onChange={(e) => {
                  setHideFromHomepage(e.target.checked);
                  markDirty();
                }}
              />
              Hide from homepage
            </label>
          </div>
          {canPublish ? (
            <div className="space-y-2 border-t border-border pt-3">
              <Label htmlFor="scheduledAt">Schedule</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => {
                  setScheduledAt(e.target.value);
                  markDirty();
                }}
              />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
