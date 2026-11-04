import { describe, expect, it } from "vitest";
import {
  WORKFLOW_TRANSITIONS,
  assertArticleOwnership,
  assertValidWorkflowTransition,
  canPerformTransition,
  hasPermission,
} from "@/lib/rbac";
import { ForbiddenError } from "@/lib/errors";
import type { AuthUser } from "@/lib/rbac";

function user(
  overrides: Partial<AuthUser> & Pick<AuthUser, "role">,
): AuthUser {
  return {
    id: overrides.id || "user-1",
    email: overrides.email || "u@example.com",
    name: overrides.name || "User",
    status: overrides.status || "ACTIVE",
    role: overrides.role,
  };
}

describe("rbac permissions", () => {
  it("denies visitor all CMS permissions", () => {
    expect(hasPermission("VISITOR", "dashboard:view")).toBe(false);
    expect(hasPermission("VISITOR", "article:publish")).toBe(false);
  });

  it("allows contributor create/edit_own but not publish", () => {
    expect(hasPermission("CONTRIBUTOR", "article:create")).toBe(true);
    expect(hasPermission("CONTRIBUTOR", "article:edit_own")).toBe(true);
    expect(hasPermission("CONTRIBUTOR", "article:publish")).toBe(false);
    expect(hasPermission("CONTRIBUTOR", "user:manage")).toBe(false);
  });

  it("allows editor approve/return but not publish", () => {
    expect(hasPermission("EDITOR", "article:approve")).toBe(true);
    expect(hasPermission("EDITOR", "article:return")).toBe(true);
    expect(hasPermission("EDITOR", "article:publish")).toBe(false);
  });

  it("allows publisher publish/schedule", () => {
    expect(hasPermission("PUBLISHER", "article:publish")).toBe(true);
    expect(hasPermission("PUBLISHER", "article:schedule")).toBe(true);
  });

  it("allows admin user and settings management", () => {
    expect(hasPermission("ADMIN", "user:manage")).toBe(true);
    expect(hasPermission("ADMIN", "settings:manage")).toBe(true);
  });
});

describe("rbac ownership", () => {
  it("allows owner without edit_any", () => {
    const u = user({ id: "a1", role: "CONTRIBUTOR" });
    expect(() => assertArticleOwnership(u, "a1")).not.toThrow();
  });

  it("blocks non-owner contributor", () => {
    const u = user({ id: "a1", role: "CONTRIBUTOR" });
    expect(() => assertArticleOwnership(u, "other")).toThrow(ForbiddenError);
  });

  it("allows editor with edit_any on others' articles", () => {
    const u = user({ id: "ed1", role: "EDITOR" });
    expect(() => assertArticleOwnership(u, "other")).not.toThrow();
  });
});

describe("rbac workflow transitions", () => {
  it("encodes the expected transition matrix", () => {
    expect(WORKFLOW_TRANSITIONS.DRAFT).toContain("IN_REVIEW");
    expect(WORKFLOW_TRANSITIONS.APPROVED).toContain("PUBLISHED");
    expect(WORKFLOW_TRANSITIONS.APPROVED).toContain("SCHEDULED");
  });

  it("rejects invalid transitions", () => {
    expect(() =>
      assertValidWorkflowTransition("DRAFT", "PUBLISHED"),
    ).toThrow(ForbiddenError);
  });

  it("contributor cannot publish approved article", () => {
    const u = user({ id: "c1", role: "CONTRIBUTOR" });
    expect(canPerformTransition(u, "APPROVED", "PUBLISHED", "c1")).toBe(false);
  });

  it("publisher can publish approved article", () => {
    const u = user({ id: "p1", role: "PUBLISHER" });
    expect(canPerformTransition(u, "APPROVED", "PUBLISHED", "author")).toBe(
      true,
    );
  });

  it("editor can approve in-review", () => {
    const u = user({ id: "e1", role: "EDITOR" });
    expect(canPerformTransition(u, "IN_REVIEW", "APPROVED", "author")).toBe(
      true,
    );
  });
});
