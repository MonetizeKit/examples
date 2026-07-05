"use client";

import { PricingTable } from "@monetizekit/react";

/**
 * Pricing page — renders the MonetizeKit `PricingTable` live from your catalog
 * via the publishable key. With no key/plans configured it shows illustrative
 * sample plans behind a clear disclaimer, so the page always renders.
 */
export default function HomePage() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Choose your plan</h1>
      <p style={{ color: "#71717a", maxWidth: 640 }}>
        Prices and features come straight from your MonetizeKit catalog — no hardcoded pricing.
      </p>
      <PricingTable showBillingToggle highlightPlan="Pro" />
    </main>
  );
}
