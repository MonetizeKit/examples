import { redirect } from "next/navigation";
import { mk } from "../../lib/mk";
import { getFleet } from "../../lib/session";

const card = {
  border: "1px solid #1f2630",
  borderRadius: 10,
  padding: "1.25rem",
  background: "#11161d",
} as const;

interface BreakdownRow {
  value: string;
  total: number;
  count: number;
  creditCost: number;
}
interface Breakdown {
  total: number;
  totalCreditCost: number;
  breakdown: BreakdownRow[];
}

export default async function UsagePage() {
  const fleet = await getFleet();
  if (!fleet) redirect("/");

  const [breakdown, credits] = await Promise.all([
    mk<Breakdown>(`/usage/${fleet.customerId}/${fleet.meterId}/breakdown?dimension=model`),
    mk<{ balance: number; totalGranted?: number; totalUsed?: number }>(`/credits/${fleet.customerId}`),
  ]);
  const rows = breakdown.breakdown ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Usage &amp; spend</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 13, color: "#8b949e" }}>Agent actions this month</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{breakdown.total}</div>
          <div style={{ fontSize: 12, color: "#8b949e" }}>credit cost: {breakdown.totalCreditCost}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 13, color: "#8b949e" }}>Credit balance</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{credits.balance}</div>
          <div style={{ fontSize: 12, color: "#8b949e" }}>
            granted {credits.totalGranted ?? "—"} · used {credits.totalUsed ?? "—"}
          </div>
        </div>
      </div>

      <section style={card}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: 16 }}>Per-model breakdown (dimension: model)</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#8b949e" }}>
              <th style={{ padding: "0.35rem 0" }}>Model</th>
              <th>Actions</th>
              <th>Credit cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: "0.5rem 0", color: "#8b949e" }}>
                  No usage yet — run some agent actions in the console.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.value} style={{ borderTop: "1px solid #1f2630" }}>
                  <td style={{ padding: "0.4rem 0" }}>{row.value}</td>
                  <td>{row.total}</td>
                  <td>{row.creditCost}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: "#8b949e", margin: "0.75rem 0 0" }}>
          Credit cost is computed server-side from the meter&apos;s <code>creditCost</code> config
          (gpt-4o = 5/action, gpt-4o-mini = 1/action).
        </p>
      </section>
    </div>
  );
}
