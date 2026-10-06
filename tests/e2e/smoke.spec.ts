import { expect, test } from "@playwright/test";

/**
 * Smoke test against seeded puzzle #1 (NEXT_PUBLIC_DEV_TODAY=2026-10-11 in .env.local, row 1 in Supabase).
 * Plays a winning game at a phone viewport and checks the share text on the clipboard.
 *
 * Guesses really reach /api/guess and land in guess_log under E2E_DEVICE_ID, so analysis can exclude them.
 * PostHog requests are answered locally: no test events reach the real project, but the CSP still applies.
 */
const E2E_DEVICE_ID = "00000000-0000-4000-8000-00000000e2e0";

const EXPECTED_SHARE = [
  "Prompt Detective #1  5/10",
  "WHO    🟨🟩",
  "DOING  🟩",
  "WHERE  🟩",
  "STYLE  🟩",
  "prompt-detective-puce.vercel.app",
].join("\n");

declare global {
  interface Window {
    __cspViolations: string[];
  }
}

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await context.route(/posthog\.com/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.addInitScript((deviceId) => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
    localStorage.setItem("pd:device", deviceId);
    // Force the clipboard path: headless Chromium may expose a share sheet it cannot show.
    Object.defineProperty(Navigator.prototype, "share", { value: undefined, configurable: true });
  }, E2E_DEVICE_ID);
});

test("plays puzzle #1 to a win and copies the share text", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/");

  // Answers must not ship with the page, including the streamed RSC payload.
  const html = await page.content();
  expect(html).not.toContain("golden retriever");
  expect(html).not.toContain("watercolor");

  // First visit opens the how-to.
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("img", { name: /./ }).first()).toBeVisible();

  const input = page.locator("#guess");
  async function guess(word: string) {
    await input.fill(word);
    await input.press("Enter");
    await expect(input).toHaveValue("");
  }

  await guess("animal"); // WARM for WHO
  await expect(page.getByText(/warm/i).first()).toBeVisible();
  await guess("golden retriever");
  await guess("bicycle");
  await guess("beach");
  // The winning guess swaps the input for the end screen.
  await input.fill("watercolor");
  await input.press("Enter");

  await expect(page.getByRole("heading", { name: "Case closed" })).toBeVisible();
  await page.getByRole("button", { name: "Share result" }).click();
  await expect(page.getByText("Result copied. Paste it anywhere.")).toBeVisible();

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  // The Windows clipboard stores line breaks as CRLF.
  expect(clipboard.replace(/\r\n/g, "\n")).toBe(EXPECTED_SHARE);

  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
