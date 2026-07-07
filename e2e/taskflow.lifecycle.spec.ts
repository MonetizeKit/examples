import { test, expect, type Page, type Locator } from "@playwright/test";
import { makeUnique } from "./support/unique";

/**
 * TaskFlow — standard SaaS lifecycle, end to end against the deployed app and
 * the live MonetizeKit API:
 *   signup -> subscribe Free -> gating (seats + analytics) -> add-on
 *   compatibility gate -> upgrade to Pro -> attach/detach add-on ->
 *   switch to Scale -> downgrade to Pro -> cancel -> reset.
 *
 * Selectors are testid-free on purpose: the gate must validate whatever is
 * currently deployed, so it targets the seeded catalog's user-visible content
 * (plan names, add-on names, gate copy) rather than markup the deployment may
 * not carry yet.
 *
 * Seeded catalog (apps/web/prisma/seed.ts `seedExamplesWorkspace`):
 *   Free  seats=1  analytics=false support=community  (no trial)
 *   Pro   seats=10 analytics=true  support=email      (14-day trial, $29)
 *   Scale seats=50 analytics=true  support=priority    ($99)
 *   Add-on "Extra Seats Pack" (+10 seats) compatible with Pro/Scale only.
 */

const unique = makeUnique("tf");

/** The nearest card (a div that contains a button) wrapping a labelled element. */
function cardFor(page: Page, label: string): Locator {
  return page
    .getByText(label, { exact: true })
    .first()
    .locator("xpath=ancestor::div[.//button][1]");
}

/**
 * Best-effort teardown: the app's "Reset demo" button archives the demo
 * customer (verified server-side by demo marker + @example.com email). The
 * sweep script (scripts/sweep-demo-customers.ts) is the backstop for any run
 * that dies before this fires, so a cancelled run can never leak state.
 */
async function resetDemo(page: Page) {
  try {
    await page.goto("/app");
    const reset = page.getByRole("button", { name: "Reset demo" });
    if (await reset.isVisible().catch(() => false)) {
      await reset.click();
      await page.waitForURL(/\/$/, { timeout: 30_000 });
    }
  } catch {
    // Intentionally swallowed — the sweep job reconciles anything left behind.
  }
}

test.describe("TaskFlow standard SaaS lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  test.afterEach(async ({ page }) => {
    await resetDemo(page);
  });

  test("signup through cancel exercises every gate", async ({ page }) => {
    const teamName = unique("acme");

    await test.step("sign up creates a demo customer", async () => {
      await page.goto("/");
      await page.locator("#name").fill(teamName);
      await page.getByRole("button", { name: /Create account/ }).click();
      await page.waitForURL(/\/pricing$/);
      await expect(page.getByRole("heading", { name: "Choose your plan" })).toBeVisible();
    });

    await test.step("subscribe to Free — analytics gated, single seat", async () => {
      await cardFor(page, "Free").getByRole("button").click();
      await page.waitForURL(/\/app$/);
      await expect(page.getByText("Advanced analytics is a premium feature")).toBeVisible();
      await expect(page.getByText(/1 \/ 1 seats used/)).toBeVisible();
    });

    await test.step("seat limit gate trips on the 2nd member (Free = 1 seat)", async () => {
      await page.getByPlaceholder("teammate@acme.com").fill("teammate@example.com");
      await page.getByRole("button", { name: "Invite" }).click();
      await page.waitForURL(/gated=seats/);
      await expect(page.getByText(/Seat limit reached \(1 seats\)/)).toBeVisible();
    });

    await test.step("add-on incompatible with Free is rejected (422)", async () => {
      await page.goto("/app/addons");
      await cardFor(page, "Extra Seats Pack").getByRole("button").click();
      await page.waitForURL(/\/app\/addons\?error=/);
      await expect(page.getByText("Add-on not available")).toBeVisible();
    });

    await test.step("upgrade to Pro unlocks analytics and raises seats to 10", async () => {
      await page.goto("/pricing");
      await cardFor(page, "Pro").getByRole("button").click();
      await page.waitForURL(/\/app$/);
      await expect(page.getByText(/Unlocked by/)).toBeVisible();
      await expect(page.getByText(/\/ 10 seats used/)).toBeVisible();
    });

    await test.step("attach Extra Seats Pack — effective seats become 20", async () => {
      await page.goto("/app/addons");
      const addonCard = cardFor(page, "Extra Seats Pack");
      await addonCard.getByRole("button", { name: "Attach add-on" }).click();
      await page.waitForURL(/\/app\/addons$/);
      await expect(
        cardFor(page, "Extra Seats Pack").getByRole("button", { name: "Remove add-on" }),
      ).toBeVisible();

      await page.goto("/app/billing");
      // Seats row: plan value 10, add-on delta +10, effective 20.
      await expect(page.locator("tr", { hasText: "Seats" })).toContainText("20");
    });

    await test.step("detach the add-on", async () => {
      await page.goto("/app/addons");
      await cardFor(page, "Extra Seats Pack").getByRole("button", { name: "Remove add-on" }).click();
      await page.waitForURL(/\/app\/addons$/);
      await expect(
        cardFor(page, "Extra Seats Pack").getByRole("button", { name: "Attach add-on" }),
      ).toBeVisible();
    });

    await test.step("switch to Scale, then downgrade to Pro", async () => {
      await page.goto("/pricing");
      await cardFor(page, "Scale").getByRole("button").click();
      await page.waitForURL(/\/app$/);
      await expect(page.getByText(/\/ 50 seats used/)).toBeVisible();

      await page.goto("/pricing");
      await cardFor(page, "Pro").getByRole("button").click();
      await page.waitForURL(/\/app$/);
      await expect(page.getByText(/\/ 10 seats used/)).toBeVisible();
    });

    await test.step("cancel — gates snap back to the no-plan defaults", async () => {
      await page.goto("/app/billing");
      await page.getByRole("button", { name: "Cancel subscription" }).click();
      await page.waitForURL(/\/pricing$/);
      await page.goto("/app");
      await expect(page.getByText("No active subscription")).toBeVisible();
    });
  });
});
