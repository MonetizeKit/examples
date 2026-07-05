"use client";

import { Paywall } from "@monetizekit/react";

/**
 * Entitlement-gated feature — `Paywall` checks the provider's customer against a
 * feature key and renders the children only when entitled, otherwise an upgrade
 * prompt. This is the "purchasing gate" from the app's perspective.
 */
export default function GatedPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Advanced analytics</h1>
      <Paywall
        feature="advanced_analytics"
        title="Upgrade to unlock advanced analytics"
        description="Cohort retention and revenue breakdowns are part of a paid plan."
        ctaLabel="See plans"
        onUpgrade={() => {
          window.location.href = "/";
        }}
      >
        <section style={{ border: "1px solid #e4e4e7", borderRadius: 8, padding: "1.5rem" }}>
          <h2 style={{ marginTop: 0 }}>📈 Your premium dashboard</h2>
          <p style={{ color: "#71717a" }}>
            This content renders only for customers entitled to <code>advanced_analytics</code>.
          </p>
        </section>
      </Paywall>
    </main>
  );
}
