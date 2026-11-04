"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavLinkItem = { href: string; label: string };

function isCurrent(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNav({
  home,
  links,
  moreLabel,
  moreItems,
}: {
  home: NavLinkItem;
  links: NavLinkItem[];
  moreLabel: string;
  moreItems: NavLinkItem[];
}) {
  const pathname = usePathname() || "/";

  return (
    <nav
      className="hidden min-w-0 flex-1 items-center lg:flex"
      aria-label="Primary"
    >
      <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
        <NavAnchor item={home} active={isCurrent(pathname, home.href, true)} />
        {links.map((item) => (
          <NavAnchor
            key={item.href}
            item={item}
            active={isCurrent(pathname, item.href)}
          />
        ))}
      </div>
      {moreItems.length > 0 ? (
        <MoreMenu label={moreLabel} items={moreItems} />
      ) : null}
    </nav>
  );
}

function NavAnchor({ item, active }: { item: NavLinkItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "whitespace-nowrap px-2.5 py-1 text-sm font-medium focus-visible:!outline-white",
        active ? "text-white" : "text-white/80 hover:text-white",
      )}
      aria-current={active ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}

function MoreMenu({
  label,
  items,
}: {
  label: string;
  items: NavLinkItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1 text-sm font-medium text-white/80 hover:text-white focus-visible:!outline-white"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 min-w-48 rounded-md border border-white/10 bg-gvn-navy py-1 shadow-xl"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="block px-3 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
