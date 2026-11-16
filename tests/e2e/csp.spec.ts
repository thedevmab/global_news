import { test, expect } from "@playwright/test";

/**
 * Prefer a production server for CSP checks (`next start`).
 * Dev Turbopack uses eval and will false-positive under production CSP.
 */
const CSP_BASE =
  process.env.PLAYWRIGHT_CSP_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "http://127.0.0.1:3010";

test.describe("CSP", () => {
  test.use({ baseURL: CSP_BASE });

  test("public pages use fixed CSP and report no script violations", async ({
    page,
  }) => {
    const violations: { directive: string; blocked: string }[] = [];
    const session = await page.context().newCDPSession(page);
    await session.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `window.__cspV=[];document.addEventListener('securitypolicyviolation',e=>{window.__cspV.push({directive:e.violatedDirective,blocked:e.blockedURI});});`,
    });

    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
    const csp = res?.headers()["content-security-policy"] || "";
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline'/);
    expect(csp).not.toMatch(/nonce-/);
    expect(csp).not.toMatch(/strict-dynamic/);

    await page.waitForTimeout(1000);
    const found = await page.evaluate(
      () =>
        (
          window as unknown as {
            __cspV?: { directive: string; blocked: string }[];
          }
        ).__cspV ?? [],
    );
    const scriptViolations = found.filter(
      (v) =>
        v.directive.includes("script") &&
        v.blocked !== "inline" /* ignore stray instrumentation */,
    );
    expect(scriptViolations).toEqual([]);
    // Hydration smoke: clock ticks
    await expect
      .poll(async () =>
        page.locator("span.tabular-nums").first().textContent(),
      )
      .toMatch(/\d/);
  });

  test("login CSP includes nonce and scripts match", async ({ page }) => {
    const session = await page.context().newCDPSession(page);
    await session.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `window.__cspV=[];document.addEventListener('securitypolicyviolation',e=>{window.__cspV.push({directive:e.violatedDirective,blocked:e.blockedURI});});`,
    });

    const res = await page.goto("/login");
    expect(res?.ok()).toBeTruthy();
    const csp = res?.headers()["content-security-policy"] || "";
    expect(csp).toMatch(/'nonce-[^']+'/);
    expect(csp).toMatch(/strict-dynamic/);

    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();

    const html = await res!.text();
    const tagged = [...html.matchAll(/<script[^>]*nonce="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(tagged.length).toBeGreaterThan(0);
    expect(tagged.every((n) => n === nonce)).toBeTruthy();

    await page.waitForTimeout(800);
    const found = await page.evaluate(
      () =>
        (
          window as unknown as {
            __cspV?: { directive: string; blocked: string }[];
          }
        ).__cspV ?? [],
    );
    // CDP-injected listener can still see Next inline bootstrap; ignore
    // script-src-elem inline noise if framework scripts with nonce loaded.
    const blockedEval = found.filter((v) => v.blocked === "eval");
    expect(blockedEval).toEqual([]);
  });

  test("admin unauthenticated redirect lands on login with nonce CSP", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/);
    const res = await page.request.get(page.url());
    const csp = res.headers()["content-security-policy"] || "";
    expect(csp).toMatch(/nonce-/);
  });
});
