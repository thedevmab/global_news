import { describe, expect, it } from "vitest";
import {
  WORKFLOW_TRANSITIONS,
  assertValidWorkflowTransition,
  canPerformTransition,
  transitionRequiresReason,
} from "@/lib/rbac";
import { ForbiddenError } from "@/lib/errors";
import type { AuthUser } from "@/lib/rbac";

const publisher: AuthUser = {
  id: "pub-1",
  email: "pub@example.com",
  name: "Publisher",
  role: "PUBLISHER",
  status: "ACTIVE",
};

const contributor: AuthUser = {
  id: "con-1",
  email: "con@example.com",
  name: "Contributor",
  role: "CONTRIBUTOR",
  status: "ACTIVE",
};

describe("workflow transitions", () => {
  it("allows draft → in_review → approved → published", () => {
    expect(() =>
      assertValidWorkflowTransition("DRAFT", "IN_REVIEW"),
    ).not.toThrow();
    expect(() =>
      assertValidWorkflowTransition("IN_REVIEW", "APPROVED"),
    ).not.toThrow();
    expect(() =>
      assertValidWorkflowTransition("APPROVED", "PUBLISHED"),
    ).not.toThrow();
  });

  it("allows scheduling from approved", () => {
    expect(WORKFLOW_TRANSITIONS.APPROVED).toContain("SCHEDULED");
    expect(canPerformTransition(publisher, "APPROVED", "SCHEDULED", "x")).toBe(
      true,
    );
  });

  it("allows cron path scheduled → published", () => {
    expect(() =>
      assertValidWorkflowTransition("SCHEDULED", "PUBLISHED"),
    ).not.toThrow();
  });

  it("rejects draft → published without urgent override path", () => {
    expect(() =>
      assertValidWorkflowTransition("DRAFT", "PUBLISHED"),
    ).toThrow(ForbiddenError);
  });

  it("requires reason when returning from review or unpublishing", () => {
    expect(transitionRequiresReason("IN_REVIEW", "DRAFT")).toBe(true);
    expect(transitionRequiresReason("PUBLISHED", "DRAFT")).toBe(true);
    expect(transitionRequiresReason("APPROVED", "PUBLISHED")).toBe(false);
  });

  it("blocks contributor from approving", () => {
    expect(
      canPerformTransition(contributor, "IN_REVIEW", "APPROVED", "con-1"),
    ).toBe(false);
  });
});
