import { describe, expect, it } from "vitest";
import { shouldTouchSession, TOUCH_INTERVAL_MS } from "@/lib/session-touch";

describe("shouldTouchSession", () => {
  it("returns false when last active within the interval", () => {
    const now = Date.parse("2026-11-13T12:00:00.000Z");
    const lastActiveAt = new Date(now - TOUCH_INTERVAL_MS + 1_000);
    expect(shouldTouchSession(lastActiveAt, now)).toBe(false);
  });

  it("returns true when last active older than the interval", () => {
    const now = Date.parse("2026-11-13T12:00:00.000Z");
    const lastActiveAt = new Date(now - TOUCH_INTERVAL_MS - 1);
    expect(shouldTouchSession(lastActiveAt, now)).toBe(true);
  });

  it("returns false at exactly the interval boundary", () => {
    const now = Date.parse("2026-11-13T12:00:00.000Z");
    const lastActiveAt = new Date(now - TOUCH_INTERVAL_MS);
    expect(shouldTouchSession(lastActiveAt, now)).toBe(false);
  });
});
