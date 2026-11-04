import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardMetrics } from "@/server/dashboard/service";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardMetrics(user);
  const { metrics, tasks, views } = data;

  const cards = [
    { label: "Published today", value: metrics.publishedToday },
    { label: "Drafts", value: metrics.drafts },
    { label: "In review", value: metrics.inReview },
    { label: "Scheduled", value: metrics.scheduled },
    { label: "Newsletter subscribers", value: metrics.subscriberCount },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-gvn-navy dark:text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {user.name}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border border-border bg-background p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-gvn-navy dark:text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      {views ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Views · last 7 days
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {views.last7Days}
            </p>
          </div>
          <div className="border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Views · last 30 days
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {views.last30Days}
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <TaskList
          title="My drafts"
          empty="No drafts yet"
          items={tasks.myDrafts}
        />
        <TaskList
          title="In review"
          empty="Nothing awaiting review"
          items={tasks.assignedReview.map((a) => ({
            ...a,
            headline: `${a.headline} · ${a.author.name}`,
          }))}
        />
        <TaskList
          title="Returned to me"
          empty="No returned articles"
          items={tasks.returned}
        />
      </section>
    </div>
  );
}

function TaskList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { id: string; headline: string; updatedAt: Date; status: string }[];
}) {
  return (
    <div className="border border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      </div>
      {items.length === 0 ? (
        <div className="p-4">
          <EmptyState title={empty} className="border-0 bg-transparent py-8" />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/articles/${item.id}/edit`}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.headline}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="muted">{item.status.replace("_", " ")}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
