import { test, expect } from "@playwright/test";

/**
 * Smoke tests — no database required. They verify the app boots, the marketing
 * page renders, the required author footer is present, and auth routes are
 * reachable. The deeper offline-sync flow is covered by the @integration spec.
 */

test("landing page renders with hero and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /write together/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /start writing/i }).first()).toBeVisible();
});

test("required author footer is present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo")).toContainText(/built by/i);
  await expect(page.getByRole("link", { name: /github/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /linkedin/i })).toBeVisible();
});

test("login and register pages are reachable", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
});

test("protected dashboard redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
