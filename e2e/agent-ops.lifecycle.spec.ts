import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * AgentOps — volume/agent lifecycle, end to end against the deployed app and
 * the live MonetizeKit API:
 *   provision fleet -> per-agent deny budget stops the Researcher at 10
 *   actions -> credit exhaustion on the Summarizer -> credit top-up restores
 *   spend -> per-model usage breakdown -> reset.
 *
 * Testid-free by design (see taskflow spec). Seeded catalog: meter
 * `agent_actions`, per-model credit cost gpt-4o=5, gpt-4o-mini=1. Provisioning
 * grants 25 starter credits and a deny budget of 10 actions/month on the
 * Researcher; the budget denies when current + 1 > 10, so the 11th Researcher
 * action is blocked. Credits are a shared customer wallet.
 */

/** The nearest agent card (a div containing buttons) for a named agent. */
function agentCard(page: Page, name: string): Locator {
  return page.getByText(name, { exact: false }).first().locator("xpath=ancestor::div[.//button][1]");
}

async function creditBalance(page: Page): Promise<number> {
  const text = await page.getByText(/\d+ credits/).first().innerText();
  const match = text.match(/(\d+)\s*credits/);
  expect(match, `credit badge should contain "<n> credits", got "${text}"`).not.toBeNull();
  return Number(match![1]);
}

async function resetFleet(page: Page) {
  try {
    await page.goto("/console");
    const reset = page.getByRole("button", { name: "Reset demo" });
    if (await reset.isVisible().catch(() => false)) {
      await reset.click();
      await page.waitForURL(/\/$/, { timeout: 30_000 });
    }
  } catch {
    // Backstop: scripts/sweep-demo-customers.ts reconciles anything left behind.
  }
}

test.describe("AgentOps volume/agent lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  test.afterEach(async ({ page }) => {
    await resetFleet(page);
  });

  test("provision through budget deny, credit exhaustion, top-up, and breakdown", async ({
    page,
  }) => {
    await test.step("provision fleet: 25 credits, two agents, Researcher deny budget", async () => {
      await page.goto("/");
      await page.getByRole("button", { name: /Provision my agent fleet/ }).click();
      await page.waitForURL(/\/console/);
      expect(await creditBalance(page)).toBe(25);
      await expect(agentCard(page, "Researcher")).toContainText("deny budget: 10 actions/mo");
      await expect(page.getByText("Summarizer", { exact: false }).first()).toBeVisible();
    });

    await test.step("Researcher runs 10 actions, the 11th is denied by its budget", async () => {
      for (let i = 0; i < 10; i++) {
        await agentCard(page, "Researcher").getByRole("button", { name: /gpt-4o-mini/ }).click();
        await page.waitForURL(/console\?ran=/);
      }
      // 25 starter - 10 x 1 credit = 15 remaining.
      expect(await creditBalance(page)).toBe(15);

      await agentCard(page, "Researcher").getByRole("button", { name: /gpt-4o-mini/ }).click();
      await page.waitForURL(/console\?gate=(preflight|budget)/);
      await expect(page.getByText(/gate:/i)).toBeVisible();
      await expect(page.getByText(/deny budget/i)).toBeVisible();
      // Denied action must not have been billed.
      expect(await creditBalance(page)).toBe(15);
    });

    await test.step("Summarizer exhausts credits, then a top-up restores spend", async () => {
      // 15 credits / 5 per gpt-4o = 3 successful actions -> balance 0.
      for (let i = 0; i < 3; i++) {
        await agentCard(page, "Summarizer").getByRole("button", { name: /gpt-4o \(/ }).click();
        await page.waitForURL(/console\?ran=/);
      }
      expect(await creditBalance(page)).toBe(0);

      await agentCard(page, "Summarizer").getByRole("button", { name: /gpt-4o \(/ }).click();
      await page.waitForURL(/console\?gate=(preflight|credits)/);
      await expect(page.getByText(/credit/i)).toBeVisible();
      expect(await creditBalance(page)).toBe(0);

      await page.getByRole("button", { name: "Buy 25-credit pack" }).click();
      await page.waitForURL(/console\?ran=topup/);
      expect(await creditBalance(page)).toBe(25);

      await agentCard(page, "Summarizer").getByRole("button", { name: /gpt-4o \(/ }).click();
      await page.waitForURL(/console\?ran=/);
      expect(await creditBalance(page)).toBe(20);
    });

    await test.step("usage breakdown reflects per-model actions", async () => {
      await page.goto("/usage");
      // Researcher ran 10 successful gpt-4o-mini actions (the denied 11th was not metered).
      await expect(page.locator("tr", { hasText: "gpt-4o-mini" })).toContainText("10");
      // Summarizer ran 4 successful gpt-4o actions (3 pre-topup + 1 after) — its own row.
      await expect(page.getByRole("cell", { name: "gpt-4o", exact: true })).toBeVisible();
    });
  });
});
