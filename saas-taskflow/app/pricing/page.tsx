import { redirect } from "next/navigation";
import { mk } from "../../lib/mk";
import { getCustomerId } from "../../lib/session";
import { subscribe, currentSubscription } from "../actions";
import { card, btn, ghostBtn, Badge } from "../ui";

interface Plan {
  id: string;
  name: string;
  description: string;
  trialDays: number | null;
  pricing: Array<{ type: string; amount: number; interval: string }>;
  entitlements: Array<{ featureDisplayName: string; type: string; value: unknown }>;
}

export default async function PricingPage() {
  const customerId = await getCustomerId();
  if (!customerId) redirect("/");
  const [plans, sub] = await Promise.all([
    mk<{ data: Plan[] }>("/plans?page=1&pageSize=20"),
    currentSubscription(),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Choose your plan</h1>
      <p style={{ color: "#71717a" }}>Live from the MonetizeKit catalog — plans, prices, trials, and entitlements.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {plans.data.map((plan) => {
          const monthly = plan.pricing.find((p) => p.interval === "monthly");
          const isCurrent = sub?.planId === plan.id;
          return (
            <div key={plan.id} style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{plan.name}</strong>
                {isCurrent ? <Badge tone="green">Current plan</Badge> : null}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>
                {monthly?.amount === 0 ? "Free" : `$${monthly?.amount ?? 0}`}
                {monthly && monthly.amount > 0 ? <span style={{ fontSize: 13, color: "#71717a", fontWeight: 400 }}>/mo</span> : null}
              </div>
              {plan.trialDays ? <Badge tone="amber">{plan.trialDays}-day free trial</Badge> : null}
              <p style={{ margin: 0, fontSize: 13, color: "#71717a" }}>{plan.description}</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#3f3f46" }}>
                {plan.entitlements.map((e) => (
                  <li key={e.featureDisplayName}>
                    {e.featureDisplayName}: {e.type === "boolean" ? (e.value ? "✓" : "—") : String(e.value)}
                  </li>
                ))}
              </ul>
              <form action={subscribe} style={{ marginTop: "auto" }}>
                <input type="hidden" name="planId" value={plan.id} />
                <button type="submit" disabled={isCurrent} style={isCurrent ? { ...ghostBtn, opacity: 0.5, cursor: "default", width: "100%" } : { ...btn, width: "100%" }}>
                  {isCurrent ? "Current plan" : sub ? "Switch to this plan" : plan.trialDays ? `Start ${plan.trialDays}-day trial` : "Subscribe"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
