import { describe, expect, it } from "vitest";
import { passwordSchema } from "@/lib/security/password";

describe("password policy", () => {
  it("requires at least 10 characters", () => {
    expect(passwordSchema.safeParse("Ab1").success).toBe(false);
    expect(passwordSchema.safeParse("Abcdefgh1x").success).toBe(true);
  });

  it("requires a letter", () => {
    expect(passwordSchema.safeParse("1234567890").success).toBe(false);
  });

  it("requires a number", () => {
    expect(passwordSchema.safeParse("Abcdefghij").success).toBe(false);
  });

  it("accepts a valid password", () => {
    const result = passwordSchema.safeParse("ChangeMeImmediately1");
    expect(result.success).toBe(true);
  });
});
