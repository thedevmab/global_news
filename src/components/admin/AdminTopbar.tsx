"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { logoutAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import type { Role } from "@prisma/client";

export function AdminTopbar({
  user,
}: {
  user: { name: string; email: string; role: Role };
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isDark = resolvedTheme === "dark";

  function signOut() {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Editorial CMS</p>
        <p className="text-xs text-muted-foreground">Global Voice Network</p>
      </div>

      <div className="relative flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <User size={14} />
          <span className="hidden sm:inline">{user.name}</span>
        </Button>

        {open ? (
          <div className="absolute right-0 top-11 z-50 w-64 rounded-md border border-border bg-card p-3 shadow-lg">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              {user.role.replace("_", " ")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start gap-2 text-gvn-red"
              onClick={signOut}
              disabled={pending}
            >
              <LogOut size={14} />
              {pending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
