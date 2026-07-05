/**
 * MonetizeKit example — Classic SaaS purchasing gate (@monetizekit/node)
 *
 * A customer WITHOUT a paid plan is denied a premium feature; the SAME feature
 * unlocks once the customer is on a plan that grants it. Your app calls
 * `entitlements.check(customerId, featureKey)` at the gate and renders/executes
 * based on `effectiveValue`.
 *
 *   MONETIZEKIT_API_KEY=mk_live_xxx NEXT_PUBLIC_MONETIZEKIT_API_BASE_URL=https://app.monetizekit.app \
 *     pnpm --filter @monetizekit-examples/node-server start:saas
 */
import { MonetizeKit } from "@monetizekit/node";

const API_KEY = process.env.MONETIZEKIT_API_KEY ?? "mk_live_demo_key";
const BASE_URL = process.env.NEXT_PUBLIC_MONETIZEKIT_API_BASE_URL ?? "https://app.monetizekit.app";

interface PlanEntitlement {
  featureKey: string;
  featureDisplayName: string;
  type: string;
  value: unknown;
}

/** Pick a published, priced plan and a boolean feature it grants (value === true). */
function pickPaidPlanAndGate(
  plans: Array<{ id: string; name: string; pricing?: Array<{ amount: number }>; entitlements?: PlanEntitlement[] }>,
) {
  const paidPlans = plans
    .filter((p) => (p.pricing ?? []).some((t) => (t.amount ?? 0) > 0))
    .sort((a, b) => (b.pricing?.[0]?.amount ?? 0) - (a.pricing?.[0]?.amount ?? 0));

  for (const plan of paidPlans.length > 0 ? paidPlans : plans) {
    const gate = (plan.entitlements ?? []).find((e) => e.type === "boolean" && e.value === true);
    if (gate) return { plan, gate };
  }
  return null;
}

async function main() {
  console.log("🛒 MonetizeKit example — Classic SaaS purchasing gate\n");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   API Key:  ${API_KEY.slice(0, 12)}…\n`);

  const mk = new MonetizeKit({ apiKey: API_KEY, baseUrl: BASE_URL });
  const createdCustomerIds: string[] = [];

  try {
    const plans = await mk.plans.list({ page: 1, pageSize: 50 });
    const picked = pickPaidPlanAndGate(plans.data as Parameters<typeof pickPaidPlanAndGate>[0]);
    if (!picked) {
      console.log("⚠️  No published plan with a boolean 'premium' feature found — seed a catalog first.");
      return;
    }
    const { plan, gate } = picked;
    console.log(`📋 Gate feature: "${gate.featureDisplayName}" (${gate.featureKey})`);
    console.log(`   Unlocked by plan: ${plan.name}\n`);

    const free = await mk.customers.create({
      name: `ref-free-${Date.now()}`,
      email: `ref-free-${Date.now()}@example.com`,
    } as Record<string, unknown>);
    createdCustomerIds.push(free.id);
    const freeCheck = await mk.entitlements.check(free.id, gate.featureKey);
    console.log(`🔒 No-plan customer → ${gate.featureKey} = ${JSON.stringify(freeCheck.effectiveValue)} (gated)`);

    const paid = await mk.customers.create({
      name: `ref-paid-${Date.now()}`,
      email: `ref-paid-${Date.now()}@example.com`,
      planId: plan.id,
    } as Record<string, unknown>);
    createdCustomerIds.push(paid.id);
    const paidCheck = await mk.entitlements.check(paid.id, gate.featureKey);
    console.log(`🔓 ${plan.name} customer → ${gate.featureKey} = ${JSON.stringify(paidCheck.effectiveValue)} (unlocked)\n`);

    const gated = freeCheck.effectiveValue !== true && paidCheck.effectiveValue === true;
    console.log(
      gated
        ? `✅ Purchasing gate verified: subscribing to ${plan.name} unlocks "${gate.featureDisplayName}".`
        : `ℹ️  Resolved values above — gating depends on the plan's entitlement configuration.`,
    );
  } finally {
    for (const id of createdCustomerIds) {
      await mk.customers.delete(id).catch(() => {});
    }
    console.log("🧹 Cleaned up demo customers.");
  }
}

main().catch((err) => {
  console.error("❌ Example failed:", (err as { message?: string })?.message ?? err);
  process.exit(1);
});
