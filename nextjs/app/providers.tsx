"use client";

import { MonetizeKitProvider } from "@monetizekit/react";
import type { ReactNode } from "react";

// Browser-safe publishable key (pk_*) + your MonetizeKit API origin. Set these
// in .env.local — see .env.example. The provider surfaces a clear ConfigNotice
// (it does not crash) when the key is missing, so the app still renders.
const publishableKey = process.env.NEXT_PUBLIC_MONETIZEKIT_PUBLISHABLE_KEY ?? "";
const baseUrl = process.env.NEXT_PUBLIC_MONETIZEKIT_BASE_URL ?? "https://app.monetizekit.app";
const customerId = process.env.NEXT_PUBLIC_MONETIZEKIT_CUSTOMER_ID || undefined;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MonetizeKitProvider
      publishableKey={publishableKey}
      baseUrl={baseUrl}
      customerId={customerId}
      appearance="light"
    >
      {children}
    </MonetizeKitProvider>
  );
}
