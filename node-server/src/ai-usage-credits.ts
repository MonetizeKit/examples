/**
 * MonetizeKit example — AI text-gen credits gate (@monetizekit/node)
 *
 * A customer buys a pack of credits; each AI generation costs credits and is
 * GATED once the balance can't cover the next call (the app then prompts to top
 * up). The pattern:
 *   const { balance } = await mk.credits.getBalance(customerId);
 *   if (balance < COST) return promptTopUp();     // gate
 *   await mk.credits.debit({ customerId, amount: COST, reason: "text.generate" });
 *
 *   MONETIZEKIT_API_KEY=mk_live_xxx NEXT_PUBLIC_MONETIZEKIT_API_BASE_URL=https://app.monetizekit.app \
 *     pnpm --filter @monetizekit-examples/node-server start:ai
 */
import { MonetizeKit } from "@monetizekit/node";

const API_KEY = process.env.MONETIZEKIT_API_KEY ?? "mk_live_demo_key";
const BASE_URL = process.env.NEXT_PUBLIC_MONETIZEKIT_API_BASE_URL ?? "https://app.monetizekit.app";

const GRANT_AMOUNT = 50;
const COST_PER_GENERATION = 20;
const GENERATION_ATTEMPTS = 3;

async function balanceOf(mk: MonetizeKit, customerId: string): Promise<number> {
  const credits = (await mk.credits.getBalance(customerId)) as { balance?: number };
  return typeof credits.balance === "number" ? credits.balance : 0;
}

async function main() {
  console.log("🤖 MonetizeKit example — AI text-gen credits gate\n");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   API Key:  ${API_KEY.slice(0, 12)}…\n`);

  const mk = new MonetizeKit({ apiKey: API_KEY, baseUrl: BASE_URL });
  let customerId: string | null = null;

  try {
    const customer = await mk.customers.create({
      name: `ref-ai-${Date.now()}`,
      email: `ref-ai-${Date.now()}@example.com`,
    } as Record<string, unknown>);
    customerId = customer.id;
    console.log(`👤 Created AI customer ${customer.id}`);

    try {
      await mk.credits.grant({ customerId: customer.id, amount: GRANT_AMOUNT, reason: "example: starter pack" });
      console.log(`💳 Granted ${GRANT_AMOUNT} credits (starter pack).`);
    } catch (err) {
      console.log(
        `⚠️  Could not grant credits on this instance (${(err as { status?: number })?.status ?? "error"}). ` +
          "Ensure the credit schema is migrated + credits are enabled, then re-run. Skipping the gate demo.",
      );
      return;
    }
    console.log(`   Starting balance: ${await balanceOf(mk, customer.id)} credits\n`);

    let allowed = 0;
    let gated = 0;
    for (let i = 1; i <= GENERATION_ATTEMPTS; i++) {
      const balance = await balanceOf(mk, customer.id);
      if (balance < COST_PER_GENERATION) {
        gated++;
        console.log(`🔒 Generation ${i}: GATED — ${balance} credits < ${COST_PER_GENERATION} cost → prompt to top up.`);
        continue;
      }
      await mk.credits.debit({ customerId: customer.id, amount: COST_PER_GENERATION, reason: "text.generate" });
      allowed++;
      console.log(`🔓 Generation ${i}: allowed — debited ${COST_PER_GENERATION}; balance now ${await balanceOf(mk, customer.id)}.`);
    }

    console.log(
      `\n✅ AI credits gate verified: ${allowed} generation(s) allowed, ${gated} gated once credits ran low ` +
        `(final balance ${await balanceOf(mk, customer.id)}).`,
    );
  } finally {
    if (customerId) await mk.customers.delete(customerId).catch(() => {});
    console.log("🧹 Cleaned up demo customer.");
  }
}

main().catch((err) => {
  console.error("❌ Example failed:", (err as { message?: string })?.message ?? err);
  process.exit(1);
});
