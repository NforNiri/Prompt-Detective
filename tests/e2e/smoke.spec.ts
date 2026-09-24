import { expect, test } from "@playwright/test";

// Placeholder. The real smoke test (seeded puzzle, winning game, share text on
// the clipboard) lands on runbook Day 6.
test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Prompt Detective" })).toBeVisible();
});
