import { redirect } from "next/navigation";
import Link from "next/link";
import { getEntitlements, mk } from "../../../lib/mk";
import { getCustomerId } from "../../../lib/session";
import { cancelSubscription, currentSubscription } from "../../actions";
import { card, ghostBtn, Badge } from "../../ui";

interface Plan {
  id: string;
  name: string;
}

export default async function BillingPage() {
  const customerId = await getCustomerId();
  if (!customerId) redirect("/");
  const [sub, entitlements, plans] = await Promise.all([
    currentSubscription(),
    getEntitlements(customerId),
    mk<{ data: Plan[] }>("/plans?page=1&pageSize=20"),
  ]);
  const planName = plans.data.find((p) => p.id === sub?.planId)?.name ?? "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Billing</h1>
      <section style={card}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: 16 }}>Subscription</h2>
        {sub ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <strong>{planName}</strong>
            <Badge tone={sub.status === "trialing" ? "amber" : "green"}>{sub.status}</Badge>
            {sub.trialEnd ? <span style={{ fontSize: 13, color: "#71717a" }}>trial ends {new Date(sub.trialEnd).toLocaleDateString()}</span> : null}
            <Link href="/pricing" style={{ marginLeft: "auto" }}>Change plan →</Link>
            <form action={cancelSubscription}>
              <button type="submit" style={{ ...ghostBtn, borderColor: "#dc2626", color: "#dc2626" }}>Cancel subscription</button>
            </form>
          </div>
        ) : (
          <p style={{ margin: 0 }}>
            No active subscription. <Link href="/pricing">Choose a plan →</Link>
          </p>
        )}
      </section>

      <section style={card}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: 16 }}>Effective entitlements (live resolution)</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#71717a" }}>
              <th style={{ padding: "0.35rem 0" }}>Feature</th>
              <th>Plan value</th>
              <th>Add-on delta</th>
              <th>Effective</th>
              <th>Sources</th>
            </tr>
          </thead>
          <tbody>
            {entitlements.map((e) => (
              <tr key={e.featureKey} style={{ borderTop: "1px solid #f4f4f5" }}>
                <td style={{ padding: "0.4rem 0" }}>{e.featureDisplayName}</td>
                <td>{String(e.planValue)}</td>
                <td>{e.addOnDelta == null ? "—" : String(e.addOnDelta)}</td>
                <td><strong>{String(e.effectiveValue)}</strong></td>
                <td style={{ color: "#71717a" }}>{e.sources.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
