import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: vi.fn(() => {
    throw new Error("revalidateTag requires a request store");
  }),
}));

import { reviveDates, invalidate } from "@/server/cache";
import { revalidateTag } from "next/cache";

describe("reviveDates", () => {
  it("revives known date keys from ISO strings", () => {
    const input = {
      id: "a1",
      publishedAt: "2026-11-06T12:00:00.000Z",
      updatedAt: "2026-11-07T08:30:00.000Z",
      createdAt: "2026-11-01T00:00:00.000Z",
      breakingExpiresAt: null,
      headline: "Hello",
      nested: {
        startsAt: "2026-12-01T00:00:00.000Z",
        endsAt: "2026-12-31T23:59:59.000Z",
        expiresAt: "2027-01-01T00:00:00.000Z",
        scheduledAt: "2026-11-15T09:00:00.000Z",
      },
    };

    const out = reviveDates(input);
    expect(out.publishedAt).toBeInstanceOf(Date);
    expect((out.publishedAt as unknown as Date).toISOString()).toBe(
      "2026-11-06T12:00:00.000Z",
    );
    expect(out.updatedAt).toBeInstanceOf(Date);
    expect(out.createdAt).toBeInstanceOf(Date);
    expect(out.breakingExpiresAt).toBeNull();
    expect(out.headline).toBe("Hello");
    expect(out.nested.startsAt).toBeInstanceOf(Date);
    expect(out.nested.endsAt).toBeInstanceOf(Date);
    expect(out.nested.expiresAt).toBeInstanceOf(Date);
    expect(out.nested.scheduledAt).toBeInstanceOf(Date);
  });

  it("leaves non-date ISO-looking strings alone on other keys", () => {
    const out = reviveDates({ slug: "2026-11-06T12:00:00.000Z", n: 3 });
    expect(out.slug).toBe("2026-11-06T12:00:00.000Z");
    expect(out.n).toBe(3);
  });

  it("revives dates inside arrays", () => {
    const out = reviveDates([
      { publishedAt: "2026-01-01T00:00:00.000Z" },
      { publishedAt: null },
    ]);
    expect(out[0].publishedAt).toBeInstanceOf(Date);
    expect(out[1].publishedAt).toBeNull();
  });
});

describe("invalidate", () => {
  it("swallows errors when called outside a request", () => {
    expect(() => invalidate("articles", "homepage")).not.toThrow();
    expect(revalidateTag).toHaveBeenCalledWith("articles", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("homepage", { expire: 0 });
  });
});
