"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: Role };
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerEntered, setDrawerEntered] = useState(false);
  const drawerTitleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeTimerRef = useRef<number | null>(null);

  const closeMobileNav = useCallback(() => {
    setDrawerEntered(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setMobileNavOpen(false);
      closeTimerRef.current = null;
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) {
      setDrawerEntered(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => setDrawerEntered(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobileNav();
    }

    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      if (previouslyFocused) previouslyFocused.focus();
      else menuButtonRef.current?.focus();
    };
  }, [mobileNavOpen, closeMobileNav]);

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40">
      <AdminSidebar
        role={user.role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        variant="docked"
      />

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            className={cn(
              "absolute inset-0 bg-black/50 transition-opacity duration-200 motion-reduce:transition-none",
              drawerEntered ? "opacity-100" : "opacity-0",
            )}
            aria-label="Close navigation menu"
            onClick={closeMobileNav}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            className={cn(
              "absolute inset-y-0 left-0 flex w-[min(18rem,calc(100vw-2.5rem))] flex-col shadow-xl transition-transform duration-200 motion-reduce:transition-none",
              drawerEntered ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <AdminSidebar
              role={user.role}
              collapsed={false}
              onToggle={() => undefined}
              variant="drawer"
              onNavigate={closeMobileNav}
              closeButtonRef={closeButtonRef}
              titleId={drawerTitleId}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          user={user}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          menuButtonRef={menuButtonRef}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:p-6",
            mobileNavOpen && "overflow-hidden",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
