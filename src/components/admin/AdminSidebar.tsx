"use client";

import type { Ref } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, type Permission } from "@/lib/rbac";
import type { Role } from "@prisma/client";
import { ADMIN_NAV } from "@/components/admin/nav";
import { Button } from "@/components/ui/button";

export function AdminSidebar({
  role,
  collapsed,
  onToggle,
  variant = "docked",
  onNavigate,
  closeButtonRef,
  titleId,
}: {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
  variant?: "docked" | "drawer";
  onNavigate?: () => void;
  closeButtonRef?: Ref<HTMLButtonElement>;
  titleId?: string;
}) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((item) =>
    hasPermission(role, item.permission as Permission),
  );
  const isDrawer = variant === "drawer";
  const showLabels = isDrawer || !collapsed;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-chrome-border bg-chrome text-chrome-foreground",
        isDrawer
          ? "w-full"
          : cn(
              "hidden transition-[width] duration-200 motion-reduce:transition-none lg:flex",
              collapsed ? "w-[72px]" : "w-64",
            ),
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-chrome-border px-3 pt-[env(safe-area-inset-top)]">
        {showLabels ? (
          <Link
            href="/admin"
            className="min-w-0"
            onClick={onNavigate}
            id={titleId}
          >
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
            onClick={onNavigate}
          >
            GVN
          </Link>
        )}
        {isDrawer ? (
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0 text-chrome-foreground/80 hover:bg-chrome-muted hover:text-chrome-foreground"
            onClick={onNavigate}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </Button>
        ) : (
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
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-chrome-muted font-semibold text-chrome-foreground"
                  : "text-chrome-foreground/70 hover:bg-chrome-muted hover:text-chrome-foreground",
                !showLabels && "justify-center px-2",
              )}
            >
              <Icon size={18} className="shrink-0" />
              {showLabels ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
