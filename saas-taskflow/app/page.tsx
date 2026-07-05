import { redirect } from "next/navigation";
import { getCustomerId } from "../lib/session";
import { createDemoAccount } from "./actions";
import { card, btn } from "./ui";

export default async function HomePage() {
  if (await getCustomerId()) redirect("/app");
  return (
    <div style={{ maxWidth: 480, margin: "3rem auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Welcome to TaskFlow</h1>
      <p style={{ color: "#71717a" }}>
        A complete standard-feature SaaS example. Every gate below — seats, premium features,
        add-ons, trials, upgrades — is enforced live by MonetizeKit; this app stores no
        monetization state of its own.
      </p>
      <form action={createDemoAccount} style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
        <label htmlFor="name" style={{ fontWeight: 600, fontSize: 14 }}>Your team name</label>
        <input id="name" name="name" placeholder="Acme Inc" style={{ padding: "0.55rem", borderRadius: 8, border: "1px solid #d4d4d8" }} />
        <button type="submit" style={btn}>Create account →</button>
        <p style={{ margin: 0, fontSize: 12, color: "#a1a1aa" }}>
          Creates a real customer via the MonetizeKit API. New accounts start with no plan —
          everything is gated until you subscribe.
        </p>
      </form>
    </div>
  );
}
