"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, type Permission } from "@/lib/rbac";
import type { Role } from "@prisma/client";
import { ADMIN_NAV } from "@/components/admin/nav";
import { Button } from "@/components/ui/button";

export function AdminSidebar({
  role,
  collapsed,
  onToggle,
}: {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((item) =>
    hasPermission(role, item.permission as Permission),
  );

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-chrome-border bg-chrome text-chrome-foreground transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-chrome-border px-3">
        {!collapsed ? (
          <Link href="/admin" className="min-w-0">
            <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-gvn-red">
              GVN
            </span>
            <span className="block truncate text-sm font-semibold">
              Newsroom
            </span>
          </Link>
        ) : (
          <Link
            href="/admin"
            className="mx-auto text-xs font-bold tracking-wider text-gvn-red"
          >
            GVN
          </Link>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-chrome-foreground/80 hover:bg-chrome-muted hover:text-chrome-foreground"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-chrome-muted font-semibold text-chrome-foreground"
                  : "text-chrome-foreground/70 hover:bg-chrome-muted hover:text-chrome-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
