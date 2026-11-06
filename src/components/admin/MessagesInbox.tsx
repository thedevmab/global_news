"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ContactStatus } from "@prisma/client";
import {
  messageDeleteAction,
  messageStatusAction,
} from "@/server/admin/actions";
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
      <div className="overflow-x-auto border border-border bg-background">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const open = expandedId === item.id;
              return (
                <tr
                  key={item.id}
                  className="border-b border-border align-top last:border-0"
                >
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2">
                    <a
                      href={`mailto:${item.email}`}
                      className="text-gvn-navy hover:underline"
                    >
                      {item.email}
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-left font-medium hover:text-gvn-red"
                      onClick={() =>
                        setExpandedId(open ? null : item.id)
                      }
                    >
                      {item.subject}
                    </button>
                    {open ? (
                      <p className="mt-2 max-w-md whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                        {item.message}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={statusVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {item.createdAt}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {item.status === "NEW" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            run(() =>
                              messageStatusAction(item.id, "READ"),
                            )
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
                            run(() =>
                              messageStatusAction(item.id, "ARCHIVED"),
                            )
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
                            run(() =>
                              messageStatusAction(item.id, "READ"),
                            )
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
                            !window.confirm(
                              "Delete this message permanently?",
                            )
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
        </table>
      </div>
    </div>
  );
}
