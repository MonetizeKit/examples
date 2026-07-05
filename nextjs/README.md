# Next.js example (`@monetizekit/react`)

A Next.js App Router app showing the drop-in MonetizeKit React components:

- **`/`** — a live `PricingTable` rendered from your catalog via a publishable key.
- **`/gated`** — a `Paywall` that gates a premium feature on an entitlement check.

## Run

```bash
pnpm install
cp .env.example .env.local   # fill in your publishable key
pnpm --filter @monetizekit-examples/nextjs dev
```

Then open http://localhost:3000. With no key configured the app still renders
(the provider shows a config notice and the pricing table falls back to sample
plans), so you can develop the UI before wiring credentials.

Environment (`.env.local`):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_MONETIZEKIT_PUBLISHABLE_KEY` | Browser-safe `pk_*` key |
| `NEXT_PUBLIC_MONETIZEKIT_BASE_URL` | API origin (default `https://app.monetizekit.app`) |
| `NEXT_PUBLIC_MONETIZEKIT_CUSTOMER_ID` | Optional — customer whose entitlements gate `/gated` |
