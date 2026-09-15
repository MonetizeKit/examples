/**
 * Backstop cleanup for the lifecycle E2E gate.
 *
 * The example apps archive their own demo customer via "Reset demo", and the
 * specs click it in teardown even on failure. But a hard-killed or cancelled
 * run can die before that fires (this is the failure mode behind issue #135 in
 * the platform repo). This script reconciles anything left behind: it lists
 * live customers, keeps only the demo records THIS suite creates (demo marker
 * attribute + @example.com email) that are older than a cutoff, and archives
 * them via the public REST API (DELETE /customers/{id} == soft archive).
 *
 * Safe by construction: it never touches records without the demo marker, and
 * archived customers are already excluded from the list endpoint, so it is
 * idempotent and only ever sees genuine live orphans.
 *
 * Usage:
 *   MONETIZEKIT_EXAMPLES_API_KEY=mk_... \
 *   NEXT_PUBLIC_MONETIZEKIT_API_BASE_URL=https://app.monetizekit.delivery \
 *   [SWEEP_MAX_AGE_MINUTES=60] [SWEEP_DRY_RUN=1] \
 *   pnpm tsx scripts/sweep-demo-customers.ts
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_MONETIZEKIT_API_BASE_URL?.trim() || "https://app.monetizekit.app";
const API_KEY =
  process.env.MONETIZEKIT_EXAMPLES_API_KEY?.trim() || process.env.MONETIZEKIT_API_KEY?.trim() || "";
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
const MAX_AGE_MINUTES = Number(process.env.SWEEP_MAX_AGE_MINUTES ?? "60");
const DRY_RUN = process.env.SWEEP_DRY_RUN === "1";

const DEMO_APPS = new Set(["taskflow", "agentops"]);

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  attributes?: Record<string, unknown> | null;
}
interface CustomerPage {
  data: Customer[];
  totalPages: number;
  page: number;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    ...(BYPASS ? { "x-vercel-protection-bypass": BYPASS } : {}),
  };
}

async function api<T>(path: string, method = "GET"): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    method,
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MonetizeKit ${method} ${path} -> ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

function isSweepableDemo(customer: Customer, cutoff: number): boolean {
  const demoApp = customer.attributes?.demoApp;
  const isDemo =
    typeof demoApp === "string" &&
    DEMO_APPS.has(demoApp) &&
    customer.email.endsWith("@example.com");
  if (!isDemo) return false;
  const createdAt = Date.parse(customer.createdAt);
  return Number.isFinite(createdAt) && createdAt < cutoff;
}

async function main() {
  if (!API_KEY) {
    throw new Error("MONETIZEKIT_EXAMPLES_API_KEY (or MONETIZEKIT_API_KEY) is required.");
  }

  const cutoff = Date.now() - MAX_AGE_MINUTES * 60_000;
  const orphans: Customer[] = [];

  let page = 1;
  // Bounded loop: page through the live customer list (archived rows are already excluded).
  for (let guard = 0; guard < 200; guard++) {
    const result = await api<CustomerPage>(`/customers?page=${page}&pageSize=100`);
    for (const customer of result.data) {
      if (isSweepableDemo(customer, cutoff)) orphans.push(customer);
    }
    if (page >= result.totalPages || result.data.length === 0) break;
    page += 1;
  }

  console.log(
    `Sweep: found ${orphans.length} live demo orphan(s) older than ${MAX_AGE_MINUTES}m` +
      (DRY_RUN ? " (dry run — nothing will be archived)." : "."),
  );

  let archived = 0;
  for (const customer of orphans) {
    if (DRY_RUN) {
      console.log(`  would archive ${customer.id} (${customer.email})`);
      continue;
    }
    try {
      await api(`/customers/${customer.id}`, "DELETE");
      archived += 1;
      console.log(`  archived ${customer.id} (${customer.email})`);
    } catch (err) {
      console.error(`  failed to archive ${customer.id}: ${(err as Error).message}`);
    }
  }

  if (!DRY_RUN) console.log(`Sweep complete: archived ${archived}/${orphans.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
