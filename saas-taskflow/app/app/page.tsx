import { redirect } from "next/navigation";
import { getEntitlements } from "../../lib/mk";
import { getCustomerId, getMembers } from "../../lib/session";
import { addTeamMember, currentSubscription } from "../actions";
import { card, btn, Badge, GateBanner } from "../ui";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ gated?: string; limit?: string }>;
}) {
  const customerId = await getCustomerId();
  if (!customerId) redirect("/");
  const params = await searchParams;
  const [entitlements, members, sub] = await Promise.all([
    getEntitlements(customerId),
    getMembers(),
    currentSubscription(),
  ]);

  const seats = entitlements.find((e) => e.featureKey === "seats");
  const analytics = entitlements.find((e) => e.featureKey === "advanced_analytics");
  const support = entitlements.find((e) => e.featureKey === "support_tier");
  const seatLimit = typeof seats?.effectiveValue === "number" ? seats.effectiveValue : 0;
  const analyticsAllowed = analytics?.effectiveValue === true;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Your workspace</h1>
        {sub ? (
          <Badge tone={sub.status === "trialing" ? "amber" : "green"}>
            {sub.status === "trialing" ? "Trialing" : "Active"} · support: {String(support?.effectiveValue ?? "—")}
          </Badge>
        ) : (
          <Badge tone="red">No plan</Badge>
        )}
      </div>

      {!sub ? (
        <GateBanner
          title="No active subscription"
          detail="Everything is gated until you subscribe — pick a plan to unlock your workspace."
          ctaHref="/pricing"
          ctaLabel="See plans"
        />
      ) : null}

      {params.gated === "seats" ? (
        <GateBanner
          title={`Seat limit reached (${params.limit} seats)`}
          detail="Your plan's seat entitlement is used up. Upgrade the plan or attach the Extra Seats Pack add-on."
          ctaHref="/app/addons"
          ctaLabel="Get more seats"
        />
      ) : null}

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>👥 Team</h2>
          <span style={{ fontSize: 13, color: "#71717a" }}>
            {members.length} / {seatLimit} seats used
            {typeof seats?.addOnDelta === "number" && seats.addOnDelta > 0 ? ` (incl. +${seats.addOnDelta} from add-on)` : ""}
          </span>
        </div>
        <ul style={{ margin: "0.75rem 0", paddingLeft: 18 }}>
          {members.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <form action={addTeamMember} style={{ display: "flex", gap: 8 }}>
          <input name="member" placeholder="teammate@acme.com" style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: "1px solid #d4d4d8" }} />
          <button type="submit" style={btn}>Invite</button>
        </form>
      </section>

      <section style={card}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: 16 }}>📈 Advanced analytics</h2>
        {analyticsAllowed ? (
          <div>
            <Badge tone="green">Unlocked by {analytics?.sources.join(" + ")}</Badge>
            <p style={{ color: "#3f3f46", fontSize: 14 }}>
              Cohort retention: <strong>84%</strong> · Net revenue retention: <strong>117%</strong> ·
              Expansion revenue: <strong>$12,400</strong>
            </p>
          </div>
        ) : (
          <GateBanner
            title="Advanced analytics is a premium feature"
            detail="Your current entitlements do not include advanced_analytics. Upgrade to Pro or Scale to unlock."
            ctaHref="/pricing"
            ctaLabel="Upgrade"
          />
        )}
      </section>
    </div>
  );
}
