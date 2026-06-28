import { test, expect } from "@playwright/test";

/**
 * Full offline-sync integration test. Requires a running MongoDB (and ideally
 * the WS server) — enable with RUN_INTEGRATION=1. Verifies the core local-first
 * guarantee: edits made while OFFLINE survive a reload (IndexedDB is the source
 * of truth) and the connection indicator reflects connectivity.
 */
const run = process.env.RUN_INTEGRATION === "1";

test.describe(run ? "offline-first editing" : "offline-first editing (skipped — set RUN_INTEGRATION=1)", () => {
  test.skip(!run, "Integration test — needs MongoDB. Set RUN_INTEGRATION=1.");

  test("offline edits persist across reload", async ({ page }) => {
    const email = `e2e_${Date.now()}@example.com`;

    // Register (auto-logs in) and land on the dashboard.
    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Create a document and open the editor.
    await page.getByRole("button", { name: /new document/i }).first().click();
    await expect(page).toHaveURL(/\/documents\//);

    const editor = page.getByRole("textbox", { name: /document editor/i });
    await editor.click();
    await editor.pressSequentially("Online text. ");

    // Go OFFLINE and keep editing.
    await page.context().setOffline(true);
    await expect(page.getByText(/offline/i)).toBeVisible();
    await editor.pressSequentially("Offline text.");

    // Reload while still offline — local-first means content is restored.
    await page.reload();
    const editorAfter = page.getByRole("textbox", { name: /document editor/i });
    await expect(editorAfter).toContainText("Online text.");
    await expect(editorAfter).toContainText("Offline text.");

    // Back online — the indicator recovers.
    await page.context().setOffline(false);
    await expect(page.getByText(/synced|syncing/i)).toBeVisible({ timeout: 15_000 });
  });
});
