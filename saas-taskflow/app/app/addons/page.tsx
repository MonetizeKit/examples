import { redirect } from "next/navigation";
import { mk } from "../../../lib/mk";
import { getCustomerId } from "../../../lib/session";
import { attachAddOn, detachAddOn } from "../../actions";
import { card, btn, ghostBtn, Badge, GateBanner } from "../../ui";

interface AddOn {
  id: string;
  name: string;
  description: string;
  pricing: Array<{ amount: number; interval: string }>;
  entitlements: Array<{ featureDisplayName: string; type: string; value: unknown }>;
}
interface Assignment {
  addOnId: string;
  status: string;
}

export default async function AddOnsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const customerId = await getCustomerId();
  if (!customerId) redirect("/");
  const params = await searchParams;
  const [addOns, assignments] = await Promise.all([
    mk<{ data: AddOn[] }>("/catalog/addons"),
    mk<Assignment[]>(`/customers/${customerId}/addons`),
  ]);
  const activeIds = new Set(assignments.filter((a) => a.status === "active").map((a) => a.addOnId));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Add-on store</h1>
      <p style={{ margin: 0, color: "#71717a" }}>
        Attach add-ons to layer entitlement deltas on top of your plan — seats add up, support upgrades.
      </p>
      {params.error ? (
        <GateBanner title="Add-on not available" detail={params.error} ctaHref="/pricing" ctaLabel="See plans" />
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {addOns.data.map((addOn) => {
          const active = activeIds.has(addOn.id);
          const price = addOn.pricing[0];
          return (
            <div key={addOn.id} style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{addOn.name}</strong>
                {active ? <Badge tone="green">Attached</Badge> : null}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#71717a" }}>{addOn.description}</p>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                ${price?.amount ?? 0}
                <span style={{ fontSize: 12, color: "#71717a", fontWeight: 400 }}>/{price?.interval === "annually" ? "yr" : "mo"}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {addOn.entitlements.map((e) => (
                  <li key={e.featureDisplayName}>
                    {e.featureDisplayName}: {e.type === "limit" ? `+${String(e.value)}` : String(e.value)}
                  </li>
                ))}
              </ul>
              <form action={active ? detachAddOn : attachAddOn} style={{ marginTop: "auto" }}>
                <input type="hidden" name="addOnId" value={addOn.id} />
                <button type="submit" style={active ? { ...ghostBtn, width: "100%" } : { ...btn, width: "100%" }}>
                  {active ? "Remove add-on" : "Attach add-on"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
