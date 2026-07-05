# Node server example (`@monetizekit/node`)

Two purchasing-gate scenarios using the MonetizeKit server SDK.

| Script | Scenario |
|--------|----------|
| `start:saas` | Classic SaaS feature paywall — a no-plan customer is denied a premium feature; subscribing unlocks it. |
| `start:ai` | AI text-gen credits — buy credits, debit per generation, gate once the balance runs low. |

## Run

```bash
pnpm install
MONETIZEKIT_API_KEY=mk_live_xxx MONETIZEKIT_BASE_URL=https://app.monetizekit.app \
  pnpm --filter @monetizekit-examples/node-server start:saas
```

Create a secret API key in the MonetizeKit dashboard (Settings → API keys). The
default `MONETIZEKIT_BASE_URL` is `https://app.monetizekit.app`; point it at your
own instance (e.g. `http://localhost:3000`) as needed.
