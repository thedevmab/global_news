import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { listMedia } from "@/server/media/service";
import { MediaUploadForm } from "@/components/admin/MediaUploadForm";
import {
  MediaLibraryGrid,
  type MediaLibraryItem,
} from "@/components/admin/MediaLibraryGrid";

export const metadata = { title: "Media" };

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/media");
  if (!hasPermission(user.role, "media:upload")) redirect("/admin");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q || "").trim() || undefined;

  const result = await listMedia(user, { page, pageSize: 24, q });
  const items: MediaLibraryItem[] = result.items.map((m) => ({
    id: m.id,
    storageKey: m.storageKey,
    originalName: m.originalName,
    altText: m.altText,
    caption: m.caption,
    credit: m.credit,
    width: m.width,
    height: m.height,
    createdAt: m.createdAt.toISOString(),
    uploadedBy: m.uploadedBy,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Media library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload image files only — JPG, PNG, or WebP up to 5MB. No remote URLs.
        </p>
      </div>

      <MediaUploadForm />

      <form className="flex flex-wrap gap-2" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or alt text"
          className="h-10 min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Search
        </button>
      </form>

      <MediaLibraryGrid items={items} />

      {result.totalPages > 1 ? (
        <nav className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {result.page} of {result.totalPages} ({result.total} files)
          </span>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <a
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
                href={`/admin/media?page=${result.page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              >
                Previous
              </a>
            ) : null}
            {result.page < result.totalPages ? (
              <a
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
                href={`/admin/media?page=${result.page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              >
                Next
              </a>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
