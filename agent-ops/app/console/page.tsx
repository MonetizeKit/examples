import { redirect } from "next/navigation";
import { mk } from "../../lib/mk";
import { getFleet } from "../../lib/session";
import { buyCredits, runAction } from "../actions";
import { MODEL_CREDIT_COST } from "../../lib/models";

const card = {
  border: "1px solid #1f2630",
  borderRadius: 10,
  padding: "1.25rem",
  background: "#11161d",
} as const;
const btn = {
  background: "#2f81f7",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "0.5rem 1rem",
  fontWeight: 600,
  cursor: "pointer",
} as const;

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ gate?: string; detail?: string; ran?: string; cost?: string }>;
}) {
  const fleet = await getFleet();
  if (!fleet) redirect("/");
  const params = await searchParams;
  const credits = await mk<{ balance: number }>(`/credits/${fleet.customerId}`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Agent console</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ background: "#1f2630", borderRadius: 999, padding: "0.3rem 0.8rem", fontSize: 13 }}>
            💳 {credits.balance} credits
          </span>
          <form action={buyCredits}>
            <button type="submit" style={btn}>Buy 25-credit pack</button>
          </form>
        </div>
      </div>

      {params.gate ? (
        <div style={{ ...card, borderColor: "#f85149", background: "#2d1517" }}>
          <strong>
            {params.gate === "budget" ? "🔒 Budget gate: action DENIED" : params.gate === "credits" ? "🔒 Credit gate: insufficient credits" : "🔒 Pre-flight gate: action blocked"}
          </strong>
          <p style={{ margin: "0.35rem 0 0", color: "#f0a8a8", fontSize: 14 }}>{params.detail}</p>
          <p style={{ margin: "0.35rem 0 0", color: "#8b949e", fontSize: 13 }}>
            {params.gate === "credits" || params.detail?.toLowerCase().includes("credit")
              ? "Buy another credit pack to continue."
              : "The Researcher has a 10-action/month deny budget — switch agents or raise the budget."}
          </p>
        </div>
      ) : null}
      {params.ran && params.ran !== "topup" ? (
        <div style={{ ...card, borderColor: "#238636", background: "#132b1a" }}>
          ✅ Action completed on <strong>{params.ran}</strong> — metered 1 unit, debited {params.cost} credit(s).
        </div>
      ) : null}
      {params.ran === "topup" ? (
        <div style={{ ...card, borderColor: "#238636", background: "#132b1a" }}>✅ Credit pack purchased (+25).</div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {fleet.agents.map((agent) => (
          <div key={agent.entityId} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>🤖 {agent.name}</strong>
              {agent.entityId === fleet.budgetAgentEntityId ? (
                <span style={{ fontSize: 12, color: "#f0b72f" }}>deny budget: 10 actions/mo</span>
              ) : (
                <span style={{ fontSize: 12, color: "#8b949e" }}>no budget</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "#8b949e" }}>
              Each run: pre-flight → usage (+1 <code>agent_actions</code>, dimension <code>model</code>) → credit debit.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(MODEL_CREDIT_COST).map(([model, cost]) => (
                <form key={model} action={runAction} style={{ flex: 1 }}>
                  <input type="hidden" name="entityId" value={agent.entityId} />
                  <input type="hidden" name="model" value={model} />
                  <button type="submit" style={{ ...btn, width: "100%", background: model === "gpt-4o" ? "#8957e5" : "#2f81f7" }}>
                    Run {model} ({cost}cr)
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
