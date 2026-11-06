import type { Permission } from "@/lib/rbac";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Newspaper,
  Home,
  FolderTree,
  ImageIcon,
  UserCog,
  Mail,
  Inbox,
  Megaphone,
  Settings,
  ScrollText,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
  { href: "/admin/articles", label: "Articles", icon: Newspaper, permission: "article:create" },
  { href: "/admin/homepage", label: "Homepage", icon: Home, permission: "homepage:manage" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, permission: "category:manage" },
  { href: "/admin/media", label: "Media", icon: ImageIcon, permission: "media:upload" },
  { href: "/admin/users", label: "Users", icon: UserCog, permission: "user:manage" },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail, permission: "newsletter:manage" },
  { href: "/admin/messages", label: "Contact", icon: Inbox, permission: "contact:manage" },
  { href: "/admin/advertisements", label: "Ads", icon: Megaphone, permission: "ad:manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, permission: "audit:view" },
];
