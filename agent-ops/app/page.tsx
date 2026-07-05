import { redirect } from "next/navigation";
import { getFleet } from "../lib/session";
import { provisionFleet } from "./actions";

export default async function HomePage() {
  if (await getFleet()) redirect("/console");
  return (
    <div style={{ maxWidth: 560, margin: "3rem auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>AgentOps</h1>
      <p style={{ color: "#8b949e" }}>
        A volume-based, agent-style monetization example. Provisioning creates — via the
        MonetizeKit API — a customer, two <strong>agent entities</strong>, a per-agent{" "}
        <strong>deny budget</strong> (10 actions/month on the Researcher), and a{" "}
        <strong>25-credit starter pack</strong>. Every action then runs the full loop:
        pre-flight → metered usage (with model dimension) → per-model credit debit.
      </p>
      <form action={provisionFleet}>
        <button
          type="submit"
          style={{ background: "#2f81f7", color: "#fff", border: "none", borderRadius: 8, padding: "0.7rem 1.4rem", fontWeight: 700, cursor: "pointer", fontSize: 15 }}
        >
          Provision my agent fleet →
        </button>
      </form>
    </div>
  );
}
