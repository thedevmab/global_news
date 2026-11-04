import { test, expect } from "@playwright/test";

test("homepage loads with GVN branding", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByAltText("Global Voice Network").first()).toBeVisible();
});

test("admin redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/login/);
});

test("robots disallows admin", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBeTruthy();
  const text = await res.text();
  expect(text).toMatch(/Disallow:\s*\/admin/i);
});
