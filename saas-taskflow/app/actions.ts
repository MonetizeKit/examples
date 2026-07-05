"use server";

/**
 * TaskFlow lifecycle server actions — every monetization mutation goes through
 * the MonetizeKit public REST API (secret key, server-side only).
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mk, MkError, getEntitlements } from "../lib/mk";
import {
  clearSession,
  getCustomerId,
  getMembers,
  getSub,
  setCustomerId,
  setMembers,
  setSub,
  type SubState,
} from "../lib/session";

interface Customer {
  id: string;
  name: string;
  email: string;
}
interface Subscription {
  id: string;
  planId: string;
  status: string;
  trialEnd?: string | null;
}
interface Plan {
  id: string;
  trialDays: number | null;
}

/** 1. Sign up — create a demo customer (no plan yet: everything gated). */
export async function createDemoAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim() || `Demo ${Date.now()}`;
  const customer = await mk<Customer>("/customers", {
    method: "POST",
    body: { name, email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}@example.com` },
  });
  await setCustomerId(customer.id);
  await setMembers([name]);
  redirect("/pricing");
}

export async function resetDemo() {
  const customerId = await getCustomerId();
  if (customerId) await mk(`/customers/${customerId}`, { method: "DELETE" }).catch(() => {});
  await clearSession();
  redirect("/");
}

/** 2. Subscribe — start a subscription (trialing when the plan has a trial). */
export async function subscribe(formData: FormData) {
  const planId = String(formData.get("planId") ?? "");
  const customerId = await getCustomerId();
  if (!customerId || !planId) redirect("/");

  const existing = await getSub();
  if (existing) {
    const updated = await mk<Subscription>(`/subscriptions/${existing.id}`, {
      method: "PATCH",
      body: { planId },
    });
    await setSub({ id: existing.id, status: updated.status ?? existing.status, planId });
  } else {
    // Plans with a trial start `trialing` with a trial end date — like a real
    // checkout would.
    const plan = await mk<Plan>(`/plans/${planId}`);
    const trialing = (plan.trialDays ?? 0) > 0;
    const trialEnd = trialing
      ? new Date(Date.now() + plan.trialDays! * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    const created = await mk<Subscription>("/subscriptions", {
      method: "POST",
      body: { customerId, planId, status: trialing ? "trialing" : "active", trialEnd },
    });
    await setSub({ id: created.id, status: created.status, planId, trialEnd });
  }
  revalidatePath("/", "layout");
  redirect("/app");
}

/** 5. Upgrade / downgrade — change the subscription's plan in place. */
export async function changePlan(formData: FormData) {
  await subscribe(formData);
}

/** 6. Cancel — end the subscription; gates snap back to no-plan defaults. */
export async function cancelSubscription() {
  const customerId = await getCustomerId();
  if (!customerId) redirect("/");
  const existing = await getSub();
  if (existing) {
    await mk(`/subscriptions/${existing.id}`, { method: "DELETE" });
    // Unassign the plan so entitlement resolution doesn't fall back to it —
    // gates snap back to the no-plan defaults immediately.
    await mk(`/customers/${customerId}`, { method: "PATCH", body: { planId: null } });
    await setSub(null);
  }
  revalidatePath("/", "layout");
  redirect("/pricing");
}

/** 3. Limit gate — adding a team member is allowed only within the seats entitlement. */
export async function addTeamMember(formData: FormData): Promise<void> {
  const name = String(formData.get("member") ?? "").trim();
  const customerId = await getCustomerId();
  if (!customerId || !name) return;

  const [entitlements, members] = await Promise.all([getEntitlements(customerId), getMembers()]);
  const seats = entitlements.find((e) => e.featureKey === "seats");
  const limit = typeof seats?.effectiveValue === "number" ? seats.effectiveValue : 0;
  if (members.length >= limit) {
    // Gated: surface via query param (the page renders the upgrade prompt).
    redirect(`/app?gated=seats&limit=${limit}`);
  }
  await setMembers([...members, name]);
  revalidatePath("/app");
}

/** 4. Add-ons — attach/detach through the customer add-on lifecycle API. */
export async function attachAddOn(formData: FormData) {
  const addOnId = String(formData.get("addOnId") ?? "");
  const customerId = await getCustomerId();
  if (!customerId || !addOnId) return;
  try {
    await mk(`/customers/${customerId}/addons`, { method: "POST", body: { addOnId } });
  } catch (err) {
    if (err instanceof MkError) redirect(`/app/addons?error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  revalidatePath("/", "layout");
  redirect("/app/addons");
}

export async function detachAddOn(formData: FormData) {
  const addOnId = String(formData.get("addOnId") ?? "");
  const customerId = await getCustomerId();
  if (!customerId || !addOnId) return;
  await mk(`/customers/${customerId}/addons/${addOnId}`, { method: "DELETE" });
  revalidatePath("/", "layout");
  redirect("/app/addons");
}

export async function currentSubscription(): Promise<SubState | null> {
  const sub = await getSub();
  return sub && (sub.status === "active" || sub.status === "trialing") ? sub : null;
}
