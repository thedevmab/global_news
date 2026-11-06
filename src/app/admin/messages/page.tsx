import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ContactStatus } from "@prisma/client";
import { MessagesInbox } from "@/components/admin/MessagesInbox";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getCurrentUser } from "@/lib/auth";
import { listMessages } from "@/server/messages/service";

export const metadata = { title: "Contact" };

export default async function AdminContactPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const status =
    sp.status && Object.values(ContactStatus).includes(sp.status as ContactStatus)
      ? (sp.status as ContactStatus)
      : undefined;
  const page = Number(sp.page || "1") || 1;
  const data = await listMessages(user, status, page);

  const hrefForPage = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/admin/messages?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Contact</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages submitted from the public contact form.
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <select
          name="status"
          defaultValue={status || ""}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.values(ContactStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
        {status ? (
          <Link
            href="/admin/messages"
            className="inline-flex h-10 items-center px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <MessagesInbox
        items={data.items.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          subject: item.subject,
          message: item.message,
          status: item.status,
          createdAt: format(item.createdAt, "MMM d, yyyy HH:mm"),
        }))}
      />

      {data.totalPages > 1 ? (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          hrefForPage={hrefForPage}
        />
      ) : null}
    </div>
  );
}
