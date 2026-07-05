import type { ReactNode } from "react";
import Link from "next/link";
import { getCustomerId } from "../lib/session";
import { resetDemo } from "./actions";

export const metadata = {
  title: "TaskFlow — MonetizeKit standard SaaS example",
  description:
    "Complete feature-SaaS lifecycle: trial → subscribe → gating → add-ons → upgrade → cancel.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const customerId = await getCustomerId();
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, background: "#fafafa", color: "#18181b" }}>
        <nav style={{ display: "flex", gap: "1.25rem", alignItems: "center", padding: "0.9rem 1.5rem", borderBottom: "1px solid #e4e4e7", background: "#fff" }}>
          <strong>📋 TaskFlow</strong>
          <Link href="/pricing">Pricing</Link>
          {customerId ? (
            <>
              <Link href="/app">Workspace</Link>
              <Link href="/app/addons">Add-ons</Link>
              <Link href="/app/billing">Billing</Link>
              <form action={resetDemo} style={{ marginLeft: "auto" }}>
                <button type="submit" style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer" }}>
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
