import type { ReactNode } from "react";
import Link from "next/link";
import { Providers } from "./providers";

export const metadata = {
  title: "MonetizeKit — Next.js example",
  description: "Pricing table + entitlement-gated feature using @monetizekit/react.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, color: "#0a0a0a" }}>
        <Providers>
          <nav style={{ display: "flex", gap: "1rem", padding: "1rem 1.5rem", borderBottom: "1px solid #e4e4e7" }}>
            <Link href="/">Pricing</Link>
            <Link href="/gated">Gated feature</Link>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
