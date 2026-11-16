"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  categoryCreateAction,
  categoryDeleteAction,
  categoryUpdateAction,
} from "@/server/admin/actions";
import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";

export type CategoryRow = {
  id: string;
  nameEn: string;
  nameAm: string | null;
  slug: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  parentName: string | null;
  sortOrder: number;
  isActive: boolean;
  articleCount: number;
};

type FormState = {
  id?: string;
  nameEn: string;
  nameAm: string;
  slug: string;
  description: string;
  color: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  nameEn: "",
  nameAm: "",
  slug: "",
  description: "",
  color: "#10213A",
  parentId: "",
  sortOrder: "0",
  isActive: true,
});

export function CategoriesManager({ items }: { items: CategoryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const parentOptions = useMemo(
    () =>
      items
        .filter((c) => !editing?.id || c.id !== editing.id)
        .map((c) => ({ id: c.id, label: c.nameEn })),
    [items, editing?.id],
  );

  function openCreate() {
    setError(null);
    setMessage(null);
    setSlugTouched(false);
    setEditing(emptyForm());
  }

  function openEdit(category: CategoryRow) {
    setError(null);
    setMessage(null);
    setSlugTouched(true);
    setEditing({
      id: category.id,
      nameEn: category.nameEn,
      nameAm: category.nameAm ?? "",
      slug: category.slug,
      description: category.description ?? "",
      color: category.color ?? "#10213A",
      parentId: category.parentId ?? "",
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
  }

  function cancel() {
    setEditing(null);
    setError(null);
  }

  function save() {
    if (!editing) return;
    if (!editing.nameEn.trim()) {
      setError("English name is required");
      return;
    }

    const payload = {
      nameEn: editing.nameEn.trim(),
      nameAm: editing.nameAm.trim() || null,
      slug: editing.slug.trim() || undefined,
      description: editing.description.trim() || null,
      color: editing.color.trim() || null,
      parentId: editing.parentId || null,
      sortOrder: Number(editing.sortOrder) || 0,
      isActive: editing.isActive,
    };

    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = editing.id
        ? await categoryUpdateAction(editing.id, payload)
        : await categoryCreateAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(editing.id ? "Category updated." : "Category created.");
      setEditing(null);
      router.refresh();
    });
  }

  function remove(category: CategoryRow) {
    const warning =
      category.articleCount > 0
        ? `“${category.nameEn}” has ${category.articleCount} article(s). It will be deactivated instead of permanently deleted. Continue?`
        : `Delete “${category.nameEn}” permanently?`;
    if (!window.confirm(warning)) return;

    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await categoryDeleteAction(category.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        category.articleCount > 0
          ? "Category deactivated because it still has articles."
          : "Category deleted.",
      );
      if (editing?.id === category.id) setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage English and Amharic category names, order, and visibility.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          disabled={pending}
          className="min-h-10 shrink-0"
        >
          Add category
        </Button>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {editing ? (
        <div className="space-y-4 border border-border bg-background p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            {editing.id ? "Edit category" : "New category"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                Name (English) <span className="text-gvn-red">*</span>
              </Label>
              <Input
                id="nameEn"
                value={editing.nameEn}
                onChange={(e) => {
                  const nameEn = e.target.value;
                  setEditing((prev) =>
                    prev
                      ? {
                          ...prev,
                          nameEn,
                          slug: slugTouched ? prev.slug : slugify(nameEn),
                        }
                      : prev,
                  );
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAm">Name (Amharic)</Label>
              <Input
                id="nameAm"
                value={editing.nameAm}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, nameAm: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={editing.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setEditing((prev) =>
                    prev ? { ...prev, slug: e.target.value } : prev,
                  );
                }}
                placeholder="auto-from-english-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentId">Parent category</Label>
              <select
                id="parentId"
                value={editing.parentId}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, parentId: e.target.value } : prev,
                  )
                }
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">None (top level)</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={editing.color || "#10213A"}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, color: e.target.value } : prev,
                    )
                  }
                  className="h-10 w-14 shrink-0 cursor-pointer p-1"
                />
                <Input
                  value={editing.color}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, color: e.target.value } : prev,
                    )
                  }
                  placeholder="#10213A"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={editing.sortOrder}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, sortOrder: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editing.description}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev,
                  )
                }
                rows={3}
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, isActive: e.target.checked } : prev,
                  )
                }
              />
              Active (visible in public navigation)
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={pending} className="min-h-10">
              {pending ? "Saving…" : editing.id ? "Save changes" : "Create category"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={cancel}
              disabled={pending}
              className="min-h-10"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {items.map((category) => (
          <li
            key={category.id}
            className="rounded-md border border-border bg-background p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {category.color ? (
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                  ) : null}
                  <p className="break-words text-sm font-semibold">
                    {category.nameEn}
                  </p>
                </div>
                {category.nameAm ? (
                  <p className="break-words text-sm text-muted-foreground">
                    {category.nameAm}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  /{category.slug}
                  {category.parentName ? ` · Parent: ${category.parentName}` : ""}
                  {` · ${category.articleCount} articles · Order ${category.sortOrder}`}
                </p>
              </div>
              <Badge variant={category.isActive ? "success" : "muted"}>
                {category.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-10"
                disabled={pending}
                onClick={() => openEdit(category)}
              >
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="min-h-10"
                disabled={pending}
                onClick={() => remove(category)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No categories yet. Add your first category.
          </li>
        ) : null}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block">
        <AdminTable>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Parent</th>
              <th>Articles</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((category) => (
              <tr key={category.id}>
                <td>
                  <div className="flex items-center gap-2">
                    {category.color ? (
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: category.color }}
                        aria-hidden
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="font-medium">{category.nameEn}</p>
                      {category.nameAm ? (
                        <p className="text-xs text-muted-foreground">
                          {category.nameAm}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground">/{category.slug}</td>
                <td>{category.parentName || "—"}</td>
                <td>{category.articleCount}</td>
                <td>{category.sortOrder}</td>
                <td>
                  <Badge variant={category.isActive ? "success" : "muted"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="admin-table-actions">
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => openEdit(category)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => remove(category)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  No categories yet. Add your first category.
                </td>
              </tr>
            ) : null}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
