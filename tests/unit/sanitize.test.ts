import { describe, expect, it } from "vitest";
import {
  parseSafeVideoEmbed,
  sanitizeArticleHtml,
} from "@/lib/security/sanitize";

describe("sanitizeArticleHtml", () => {
  it("strips script tags", () => {
    const html = sanitizeArticleHtml(
      `<p>Hello</p><script>alert('xss')</script>`,
    );
    expect(html).toContain("Hello");
    expect(html.toLowerCase()).not.toContain("<script");
  });

  it("keeps safe formatting tags", () => {
    const html = sanitizeArticleHtml(
      `<h2>Title</h2><p><strong>Bold</strong> and <em>italic</em></p>`,
    );
    expect(html).toContain("<h2>");
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
  });

  it("adds rel noopener to links", () => {
    const html = sanitizeArticleHtml(`<a href="https://example.com">x</a>`);
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("removes javascript: urls", () => {
    const html = sanitizeArticleHtml(
      `<a href="javascript:alert(1)">click</a>`,
    );
    expect(html.toLowerCase()).not.toContain("javascript:");
  });
});

describe("parseSafeVideoEmbed", () => {
  it("parses youtube watch urls", () => {
    const parsed = parseSafeVideoEmbed(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(parsed).toEqual({ provider: "youtube", id: "dQw4w9WgXcQ" });
  });

  it("parses vimeo urls", () => {
    const parsed = parseSafeVideoEmbed("https://vimeo.com/123456789");
    expect(parsed).toEqual({ provider: "vimeo", id: "123456789" });
  });

  it("rejects unknown hosts", () => {
    expect(parseSafeVideoEmbed("https://evil.example/embed/1")).toBeNull();
  });
});
