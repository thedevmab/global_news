import { describe, expect, it } from "vitest";
import {
  escapeIlike,
  parseSearchParams,
} from "@/server/search/params";

describe("parseSearchParams", () => {
  it("returns empty query and defaults", () => {
    const parsed = parseSearchParams({});
    expect(parsed.q).toBe("");
    expect(parsed.type).toBe("all");
    expect(parsed.sort).toBe("relevance");
    expect(parsed.language).toBe("");
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(12);
  });

  it("applies default language when language param is omitted", () => {
    const parsed = parseSearchParams(
      { q: "ethiopia" },
      { defaultLanguage: "am" },
    );
    expect(parsed.language).toBe("am");
    expect(parsed.q).toBe("ethiopia");
  });

  it("allows clearing language with all", () => {
    const parsed = parseSearchParams(
      { q: "news", language: "all" },
      { defaultLanguage: "en" },
    );
    expect(parsed.language).toBe("");
  });

  it("parses type, sort, category, author, and page", () => {
    const parsed = parseSearchParams({
      q: "climate",
      type: "video",
      sort: "newest",
      category: "world",
      author: "jane-doe",
      page: "3",
      language: "en",
    });
    expect(parsed).toMatchObject({
      q: "climate",
      type: "video",
      sort: "newest",
      category: "world",
      author: "jane-doe",
      page: 3,
      language: "en",
    });
  });

  it("rejects invalid type and sort", () => {
    const parsed = parseSearchParams({
      type: "meme",
      sort: "popular",
    });
    expect(parsed.type).toBe("all");
    expect(parsed.sort).toBe("relevance");
  });

  it("accepts valid ISO dates and drops invalid ones", () => {
    const parsed = parseSearchParams({
      from: "2024-01-15",
      to: "not-a-date",
    });
    expect(parsed.from).toBe("2024-01-15");
    expect(parsed.to).toBe("");
  });

  it("clamps page size", () => {
    expect(parseSearchParams({}, { pageSize: 100 }).pageSize).toBe(48);
    expect(parseSearchParams({}, { pageSize: 0 }).pageSize).toBe(1);
  });
});

describe("escapeIlike", () => {
  it("escapes percent, underscore, and backslash", () => {
    expect(escapeIlike(`a%b_c\\d`)).toBe(`a\\%b\\_c\\\\d`);
  });
});
