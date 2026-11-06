import { ArticleStatus, Role, type User } from "@prisma/client";
import { AuthError, ForbiddenError } from "@/lib/errors";

export type Permission =
  | "article:create"
  | "article:edit_own"
  | "article:edit_any"
  | "article:submit_review"
  | "article:review"
  | "article:approve"
  | "article:return"
  | "article:publish"
  | "article:schedule"
  | "article:unpublish"
  | "article:archive"
  | "article:trash"
  | "article:urgent_publish"
  | "article:manage_breaking"
  | "homepage:manage"
  | "category:manage"
  | "tag:manage"
  | "media:upload"
  | "media:manage"
  | "author:manage"
  | "user:manage"
  | "newsletter:manage"
  | "contact:manage"
  | "ad:manage"
  | "settings:manage"
  | "audit:view"
  | "dashboard:view";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  VISITOR: [],
  CONTRIBUTOR: [
    "dashboard:view",
    "article:create",
    "article:edit_own",
    "article:submit_review",
    "media:upload",
  ],
  EDITOR: [
    "dashboard:view",
    "article:create",
    "article:edit_own",
    "article:edit_any",
    "article:submit_review",
    "article:review",
    "article:approve",
    "article:return",
    "category:manage",
    "tag:manage",
    "media:upload",
    "media:manage",
    "author:manage",
  ],
  PUBLISHER: [
    "dashboard:view",
    "article:create",
    "article:edit_own",
    "article:edit_any",
    "article:submit_review",
    "article:review",
    "article:approve",
    "article:return",
    "article:publish",
    "article:schedule",
    "article:unpublish",
    "article:archive",
    "article:trash",
    "article:urgent_publish",
    "article:manage_breaking",
    "homepage:manage",
    "category:manage",
    "tag:manage",
    "media:upload",
    "media:manage",
    "author:manage",
  ],
  ADMIN: [
    "dashboard:view",
    "article:create",
    "article:edit_own",
    "article:edit_any",
    "article:submit_review",
    "article:review",
    "article:approve",
    "article:return",
    "article:publish",
    "article:schedule",
    "article:unpublish",
    "article:archive",
    "article:trash",
    "article:urgent_publish",
    "article:manage_breaking",
    "homepage:manage",
    "category:manage",
    "tag:manage",
    "media:upload",
    "media:manage",
    "author:manage",
    "user:manage",
    "newsletter:manage",
    "contact:manage",
    "ad:manage",
    "settings:manage",
    "audit:view",
  ],
  SUPER_ADMIN: [
    "dashboard:view",
    "article:create",
    "article:edit_own",
    "article:edit_any",
    "article:submit_review",
    "article:review",
    "article:approve",
    "article:return",
    "article:publish",
    "article:schedule",
    "article:unpublish",
    "article:archive",
    "article:trash",
    "article:urgent_publish",
    "article:manage_breaking",
    "homepage:manage",
    "category:manage",
    "tag:manage",
    "media:upload",
    "media:manage",
    "author:manage",
    "user:manage",
    "newsletter:manage",
    "contact:manage",
    "ad:manage",
    "settings:manage",
    "audit:view",
  ],
};

export type AuthUser = Pick<User, "id" | "email" | "name" | "role" | "status">;

/** Newsroom roles that may access `/admin`. */
export const STAFF_ROLES: Role[] = [
  "CONTRIBUTOR",
  "EDITOR",
  "PUBLISHER",
  "ADMIN",
  "SUPER_ADMIN",
];

export function isStaffRole(role: Role | null | undefined): boolean {
  if (!role) return false;
  return STAFF_ROLES.includes(role);
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requireAuthenticatedUser(
  user: AuthUser | null | undefined,
): AuthUser {
  if (!user) throw new AuthError("Authentication required");
  if (user.status === "SUSPENDED") {
    throw new AuthError("Account suspended");
  }
  return user;
}

export function requirePermission(
  user: AuthUser | null | undefined,
  permission: Permission,
): AuthUser {
  const u = requireAuthenticatedUser(user);
  if (!hasPermission(u.role, permission)) {
    throw new ForbiddenError("Insufficient permissions");
  }
  return u;
}

export function requireRole(
  user: AuthUser | null | undefined,
  roles: Role[],
): AuthUser {
  const u = requireAuthenticatedUser(user);
  if (!roles.includes(u.role)) {
    throw new ForbiddenError("Insufficient role");
  }
  return u;
}

export function assertArticleOwnership(
  user: AuthUser,
  authorId: string,
  permissionIfAny: Permission = "article:edit_any",
): void {
  if (user.id === authorId) return;
  if (hasPermission(user.role, permissionIfAny)) return;
  throw new ForbiddenError("You do not own this article");
}

export const WORKFLOW_TRANSITIONS: Record<
  ArticleStatus,
  ArticleStatus[]
> = {
  DRAFT: ["IN_REVIEW", "PUBLISHED", "SCHEDULED", "TRASH"],
  IN_REVIEW: ["APPROVED", "DRAFT"],
  APPROVED: ["PUBLISHED", "SCHEDULED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "DRAFT", "APPROVED"],
  PUBLISHED: ["DRAFT", "ARCHIVED", "TRASH"],
  ARCHIVED: ["DRAFT", "TRASH"],
  TRASH: ["DRAFT"],
};

export function assertValidWorkflowTransition(
  from: ArticleStatus,
  to: ArticleStatus,
): void {
  const allowed = WORKFLOW_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ForbiddenError(
      `Invalid workflow transition: ${from} → ${to}`,
    );
  }
}

export function transitionRequiresReason(
  from: ArticleStatus,
  to: ArticleStatus,
): boolean {
  return (
    (from === "IN_REVIEW" && to === "DRAFT") ||
    (from === "PUBLISHED" && to === "DRAFT")
  );
}

export function canPerformTransition(
  user: AuthUser,
  from: ArticleStatus,
  to: ArticleStatus,
  authorId: string,
): boolean {
  try {
    assertValidWorkflowTransition(from, to);
  } catch {
    return false;
  }

  if (from === "DRAFT" && to === "IN_REVIEW") {
    return (
      hasPermission(user.role, "article:submit_review") &&
      (user.id === authorId || hasPermission(user.role, "article:edit_any"))
    );
  }
  if (from === "DRAFT" && (to === "PUBLISHED" || to === "SCHEDULED")) {
    return hasPermission(user.role, "article:publish");
  }
  if (from === "IN_REVIEW" && to === "APPROVED") {
    return hasPermission(user.role, "article:approve");
  }
  if (from === "IN_REVIEW" && to === "DRAFT") {
    return hasPermission(user.role, "article:return");
  }
  if (to === "PUBLISHED" || to === "SCHEDULED") {
    return hasPermission(user.role, "article:publish");
  }
  if (from === "PUBLISHED" && to === "DRAFT") {
    return hasPermission(user.role, "article:unpublish");
  }
  if (to === "ARCHIVED") {
    return hasPermission(user.role, "article:archive");
  }
  if (to === "TRASH") {
    return hasPermission(user.role, "article:trash");
  }
  if (to === "DRAFT") {
    return (
      user.id === authorId || hasPermission(user.role, "article:edit_any")
    );
  }
  return false;
}
