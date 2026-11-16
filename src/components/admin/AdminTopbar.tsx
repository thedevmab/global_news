"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type Ref,
} from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Menu, Moon, Sun, User } from "lucide-react";
import { logoutAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import type { Role } from "@prisma/client";

export function AdminTopbar({
  user,
  onOpenMobileNav,
  menuButtonRef,
}: {
  user: { name: string; email: string; role: Role };
  onOpenMobileNav?: () => void;
  menuButtonRef?: Ref<HTMLButtonElement>;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function signOut() {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-background px-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)]">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenMobileNav ? (
          <Button
            ref={menuButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0 lg:hidden"
            aria-label="Open navigation menu"
            onClick={onOpenMobileNav}
          >
            <Menu size={20} />
          </Button>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            Editorial CMS
          </p>
          <p className="hidden truncate text-xs text-muted-foreground md:block">
            Global Voice Network
          </p>
        </div>
      </div>

      <div ref={menuRef} className="relative flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Toggle theme"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {mounted && isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 gap-2"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <User size={14} />
          <span className="hidden sm:inline">{user.name}</span>
        </Button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-12 z-50 w-[min(16rem,calc(100vw-1.5rem))] rounded-md border border-border bg-card p-3 shadow-lg"
          >
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              {user.role.replace("_", " ")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 min-h-11 w-full justify-start gap-2 text-gvn-red"
              onClick={signOut}
              disabled={pending}
              role="menuitem"
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
