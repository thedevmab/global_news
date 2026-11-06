"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { homepageUpdateAction } from "@/server/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type HomepageArticleOption = {
  id: string;
  headline: string;
  language: string;
  categoryName: string;
  publishedAt: string | null;
};

export function HomepageLayoutForm({
  articles,
  initialLeadId,
  initialSecondaryIds,
}: {
  articles: HomepageArticleOption[];
  initialLeadId: string | null;
  initialSecondaryIds: string[];
}) {
  const router = useRouter();
  const [leadArticleId, setLeadArticleId] = useState(initialLeadId ?? "");
  const [secondaryIds, setSecondaryIds] = useState<string[]>(
    initialSecondaryIds.slice(0, 4),
  );
  const [mode, setMode] = useState<"auto" | "curated">(
    initialLeadId || initialSecondaryIds.length ? "curated" : "auto",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const secondaryChoices = useMemo(
    () => articles.filter((a) => a.id !== leadArticleId),
    [articles, leadArticleId],
  );

  function toggleSecondary(id: string) {
    setSecondaryIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await homepageUpdateAction(
        mode === "auto"
          ? { leadArticleId: null, secondaryArticleIds: [] }
          : {
              leadArticleId: leadArticleId || null,
              secondaryArticleIds: secondaryIds.filter(
                (id) => id && id !== leadArticleId,
              ),
            },
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        mode === "auto"
          ? "Homepage will show the newest published articles."
          : "Homepage layout saved.",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 border border-border bg-card p-4">
        <p className="text-sm font-semibold">Homepage mode</p>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            checked={mode === "auto"}
            onChange={() => setMode("auto")}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Automatic (recommended)</span>
            <span className="mt-0.5 block text-muted-foreground">
              Hero and Top Stories use the most recently published articles from
              the dashboard. No pinning required.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            checked={mode === "curated"}
            onChange={() => setMode("curated")}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Curated</span>
            <span className="mt-0.5 block text-muted-foreground">
              Manually choose the lead story and up to four Top Stories.
            </span>
          </span>
        </label>
      </div>

      {mode === "curated" ? (
        <div className="space-y-5 border border-border bg-card p-4">
          <div className="space-y-2">
            <Label htmlFor="lead">Lead / hero article</Label>
            <select
              id="lead"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={leadArticleId}
              onChange={(e) => {
                setLeadArticleId(e.target.value);
                setSecondaryIds((prev) =>
                  prev.filter((id) => id !== e.target.value),
                );
              }}
            >
              <option value="">Select published article…</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.language}] {a.headline} — {a.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Top Stories (max 4)</Label>
            {secondaryChoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Publish more articles to fill Top Stories.
              </p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto border border-border p-3">
                {secondaryChoices.map((a) => {
                  const checked = secondaryIds.includes(a.id);
                  const disabled = !checked && secondaryIds.length >= 4;
                  return (
                    <li key={a.id}>
                      <label
                        className={`flex items-start gap-2 text-sm ${
                          disabled ? "opacity-50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleSecondary(a.id)}
                        />
                        <span>
                          <span className="font-medium">{a.headline}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {a.categoryName} · {a.language}
                            {a.publishedAt
                              ? ` · ${new Date(a.publishedAt).toLocaleDateString()}`
                              : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Selected: {secondaryIds.length}/4
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <Button type="button" onClick={save} disabled={pending}>
        {pending ? "Saving…" : "Save homepage"}
      </Button>
    </div>
  );
}
