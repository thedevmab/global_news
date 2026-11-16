"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ContactStatus } from "@prisma/client";
import {
  messageDeleteAction,
  messageStatusAction,
} from "@/server/admin/actions";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
};

function statusVariant(
  status: ContactStatus,
): "accent" | "success" | "muted" | "outline" {
  switch (status) {
    case "NEW":
      return "accent";
    case "READ":
      return "success";
    case "REPLIED":
      return "outline";
    default:
      return "muted";
  }
}

export function MessagesInbox({ items }: { items: MessageRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No contact messages yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-gvn-red" role="alert">
          {error}
        </p>
      ) : null}
      <AdminTable>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const open = expandedId === item.id;
            return (
              <tr key={item.id} className="align-top">
                <td data-label="Name" className="font-medium">
                  {item.name}
                </td>
                <td data-label="Email">
                  <a
                    href={`mailto:${item.email}`}
                    className="break-all text-gvn-navy hover:underline"
                  >
                    {item.email}
                  </a>
                </td>
                <td data-label="Subject">
                  <button
                    type="button"
                    className="break-words text-left font-medium hover:text-gvn-red"
                    onClick={() => setExpandedId(open ? null : item.id)}
                  >
                    {item.subject}
                  </button>
                  {open ? (
                    <p className="mt-2 w-full max-w-none whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
                      {item.message}
                    </p>
                  ) : null}
                </td>
                <td data-label="Status">
                  <Badge variant={statusVariant(item.status)}>
                    {item.status}
                  </Badge>
                </td>
                <td data-label="Date" className="text-muted-foreground">
                  {item.createdAt}
                </td>
                <td data-label="Actions" className="admin-table-actions">
                  <div className="flex flex-wrap gap-1.5">
                    {item.status === "NEW" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          run(() => messageStatusAction(item.id, "READ"))
                        }
                      >
                        Mark read
                      </Button>
                    ) : null}
                    {item.status !== "ARCHIVED" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          run(() => messageStatusAction(item.id, "ARCHIVED"))
                        }
                      >
                        Archive
                      </Button>
                    ) : null}
                    {item.status === "ARCHIVED" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          run(() => messageStatusAction(item.id, "READ"))
                        }
                      >
                        Unarchive
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => {
                        if (
                          !window.confirm("Delete this message permanently?")
                        ) {
                          return;
                        }
                        run(() => messageDeleteAction(item.id));
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>
    </div>
  );
}
