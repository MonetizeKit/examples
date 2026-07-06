"use server";

/**
 * AgentOps lifecycle server actions — the volume/agent-style monetization loop:
 * entities per agent → pre-flight → dimensional usage → budgets → credits.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mk, MkError } from "../lib/mk";
import { MODEL_CREDIT_COST } from "../lib/models";
import { clearFleet, getFleet, setFleet } from "../lib/session";

const STARTER_CREDITS = 25;
const BUDGET_HARD_LIMIT = 10; // actions/month for the budgeted agent (deny policy)

interface Meter {
  id: string;
  key: string;
}
interface Entity {
  id: string;
  externalId: string;
  name: string;
}

/**
 * Provision a demo fleet: a customer, two agent entities, a **deny** budget on
 * agent-1 (hard limit of actions per month), and a starter credit pack.
 */
/** Marker written at creation and required before any delete (see resetFleet). */
const DEMO_MARKER = { demoApp: "agentops" } as const;

export async function provisionFleet() {
  const suffix = Date.now();
  const customer = await mk<{ id: string }>("/customers", {
    method: "POST",
    body: {
      name: `AgentOps Fleet ${suffix}`,
      email: `agent-fleet-${suffix}@example.com`,
      attributes: DEMO_MARKER,
    },
  });

  const meters = await mk<{ data: Meter[] }>("/catalog/meters");
  const meter = meters.data.find((m) => m.key === "agent_actions");
  if (!meter) throw new Error("Meter agent_actions not found — seed the Examples catalog first.");

  const researcher = await mk<Entity>(`/customers/${customer.id}/entities`, {
    method: "POST",
    body: { type: "agent", externalId: `researcher-${suffix}`, name: "Researcher" },
  });
  const summarizer = await mk<Entity>(`/customers/${customer.id}/entities`, {
    method: "POST",
    body: { type: "agent", externalId: `summarizer-${suffix}`, name: "Summarizer" },
  });

  // Per-agent spend governance: the Researcher gets a hard deny budget.
  await mk("/budgets", {
    method: "POST",
    body: {
      customerId: customer.id,
      entityId: researcher.id,
      meterIds: [meter.id],
      meterNames: ["Agent Actions"],
      softThreshold: Math.floor(BUDGET_HARD_LIMIT * 0.8),
      hardThreshold: BUDGET_HARD_LIMIT,
      policy: "deny",
    },
  });

  // Starter credit pack (the "purchase").
  await mk("/credits/grant", {
    method: "POST",
    body: { customerId: customer.id, amount: STARTER_CREDITS, reason: "starter pack" },
  });

  await setFleet({
    customerId: customer.id,
    meterId: meter.id,
    agents: [
      { entityId: researcher.id, name: "Researcher" },
      { entityId: summarizer.id, name: "Summarizer" },
    ],
    budgetAgentEntityId: researcher.id,
  });
  redirect("/console");
}

/**
 * Reset — deletes the session's fleet customer. Defense in depth against
 * abuse: the customer id comes from an HMAC-signed cookie (unforgeable), and
 * the server re-verifies the target is a record THIS app created (demo marker
 * + @example.com email) before deleting. Anything else is left untouched.
 */
export async function resetFleet() {
  const fleet = await getFleet();
  if (fleet) {
    try {
      const customer = await mk<{ email: string; attributes?: Record<string, unknown> }>(
        `/customers/${fleet.customerId}`,
      );
      const isDemoRecord =
        customer.attributes?.demoApp === DEMO_MARKER.demoApp &&
        customer.email.endsWith("@example.com");
      if (isDemoRecord) await mk(`/customers/${fleet.customerId}`, { method: "DELETE" });
    } catch {
      // Customer already gone or unreadable — clearing the session is enough.
    }
  }
  await clearFleet();
  redirect("/");
}

/**
 * Run one agent action: pre-flight (budget + credit check) → submit usage with
 * subject + dimensions → debit credits at the per-model rate. Gate outcomes are
 * surfaced to the console via query params.
 */
export async function runAction(formData: FormData) {
  const entityId = String(formData.get("entityId") ?? "");
  const model = String(formData.get("model") ?? "gpt-4o-mini");
  const fleet = await getFleet();
  if (!fleet || !entityId) redirect("/");

  const cost = MODEL_CREDIT_COST[model] ?? 1;

  // 1. Pre-flight: would this action clear the budget AND the credit balance?
  const preflight = await mk<{ allowed: boolean; reasons?: string[] }>("/entitlements/preflight", {
    method: "POST",
    body: {
      customerId: fleet.customerId,
      subjectId: entityId,
      meterId: fleet.meterId,
      estimatedValue: 1,
      requiredCredits: cost,
    },
  });
  if (!preflight.allowed) {
    redirect(`/console?gate=preflight&detail=${encodeURIComponent((preflight.reasons ?? []).join("; "))}`);
  }

  // 2. Metered usage, attributed to the agent with model dimension.
  try {
    await mk("/usage/events", {
      method: "POST",
      body: {
        customerId: fleet.customerId,
        meterId: fleet.meterId,
        value: 1,
        subjectId: entityId,
        dimensions: { model },
        description: `agent action (${model})`,
      },
    });
  } catch (err) {
    if (err instanceof MkError && (err.status === 402 || err.code === "BUDGET_EXCEEDED")) {
      redirect(`/console?gate=budget&detail=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  // 3. Credits: debit the per-model cost.
  try {
    await mk("/credits/debit", {
      method: "POST",
      body: {
        customerId: fleet.customerId,
        amount: cost,
        reason: `agent action (${model})`,
        dimensions: { model },
      },
    });
  } catch (err) {
    if (err instanceof MkError && err.status === 409) {
      redirect(`/console?gate=credits&detail=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath("/console");
  redirect(`/console?ran=${encodeURIComponent(model)}&cost=${cost}`);
}

/** Buy another credit pack. */
export async function buyCredits() {
  const fleet = await getFleet();
  if (!fleet) redirect("/");
  await mk("/credits/grant", {
    method: "POST",
    body: { customerId: fleet.customerId, amount: STARTER_CREDITS, reason: "top-up pack" },
  });
  revalidatePath("/console");
  redirect("/console?ran=topup");
}
