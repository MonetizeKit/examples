import { defineConfig, devices } from "@playwright/test";

/**
 * W6 mandatory lifecycle gate.
 *
 * Drives the real deployed example apps (TaskFlow + AgentOps) end-to-end so a
 * broken purchasing/usage flow is caught before customers see it. Two modes:
 *
 *  - Deployed (default): targets the `.delivery` tier. When the deployments sit
 *    behind Vercel Deployment Protection, set `VERCEL_AUTOMATION_BYPASS_SECRET`
 *    and it is sent as `x-vercel-protection-bypass` on every request. Cookies
 *    the apps set are `Secure`, which works over the HTTPS delivery URLs.
 *  - Local (`E2E_LOCAL=1`): spins up both apps via `next dev` on distinct ports.
 *    The apps still need `MONETIZEKIT_EXAMPLES_API_KEY` +
 *    `NEXT_PUBLIC_MONETIZEKIT_API_BASE_URL` in the environment to reach the API.
 */

const LOCAL = process.env.E2E_LOCAL === "1";
const isCI = !!process.env.CI;
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();

const TASKFLOW_LOCAL_PORT = 3100;
const AGENTOPS_LOCAL_PORT = 3200;

const taskflowUrl =
  process.env.TASKFLOW_BASE_URL?.trim() ||
  (LOCAL ? `http://localhost:${TASKFLOW_LOCAL_PORT}` : "https://taskflow.monetizekit.delivery");
const agentopsUrl =
  process.env.AGENTOPS_BASE_URL?.trim() ||
  (LOCAL ? `http://localhost:${AGENTOPS_LOCAL_PORT}` : "https://agentops.monetizekit.delivery");

const extraHTTPHeaders = bypass ? { "x-vercel-protection-bypass": bypass } : undefined;

export default defineConfig({
  testDir: __dirname,
  // Lifecycle specs mutate real subscription/credit state step by step, so they
  // must run serially within a file. Keep the whole suite single-worker.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 150_000,
  expect: { timeout: 20_000 },
  reporter: isCI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    extraHTTPHeaders,
  },
  projects: [
    {
      name: "taskflow",
      testMatch: /taskflow\.lifecycle\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: taskflowUrl },
    },
    {
      name: "agentops",
      testMatch: /agent-ops\.lifecycle\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: agentopsUrl },
    },
  ],
  webServer: LOCAL
    ? [
        {
          command: `pnpm --filter @monetizekit-examples/saas-taskflow exec next dev -p ${TASKFLOW_LOCAL_PORT}`,
          url: `http://localhost:${TASKFLOW_LOCAL_PORT}`,
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
        {
          command: `pnpm --filter @monetizekit-examples/agent-ops exec next dev -p ${AGENTOPS_LOCAL_PORT}`,
          url: `http://localhost:${AGENTOPS_LOCAL_PORT}`,
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
      ]
    : undefined,
});
