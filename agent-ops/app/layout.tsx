import type { ReactNode } from "react";
import Link from "next/link";
import { getFleet } from "../lib/session";
import { resetFleet } from "./actions";

export const metadata = {
  title: "AgentOps — MonetizeKit volume/agent example",
  description:
    "Per-agent entities, pre-flight checks, dimensional metering, budget enforcement, and credit packs.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const fleet = await getFleet();
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, background: "#0b0f14", color: "#e6edf3" }}>
        <nav style={{ display: "flex", gap: "1.25rem", alignItems: "center", padding: "0.9rem 1.5rem", borderBottom: "1px solid #1f2630" }}>
          <strong>🤖 AgentOps</strong>
          {fleet ? (
            <>
              <Link href="/console" style={{ color: "#8bb9fe" }}>Console</Link>
              <Link href="/usage" style={{ color: "#8bb9fe" }}>Usage &amp; spend</Link>
              <form action={resetFleet} style={{ marginLeft: "auto" }}>
                <button type="submit" style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer" }}>
                  Reset demo
                </button>
              </form>
            </>
          ) : null}
        </nav>
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.5rem" }}>{children}</main>
      </body>
    </html>
  );
}
