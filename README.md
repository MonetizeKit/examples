# MonetizeKit examples

Official, runnable examples of integrating [MonetizeKit](https://monetizekit.app)
across multiple frameworks — kept **continuously aligned** with the latest SDKs,
React components, and public APIs via CI.

Each example demonstrates the **purchasing gate**: the point where your app
checks entitlement/credit state and allows or blocks access.

## Examples

| Example | Path | What it shows |
|---------|------|---------------|
| **TaskFlow** — complete standard-feature SaaS | [`saas-taskflow/`](./saas-taskflow) | Full lifecycle: signup → trial → subscribe → feature/limit gating → **add-ons** (entitlement deltas) → upgrade/downgrade → cancel. |
| **AgentOps** — complete volume/agent application | [`agent-ops/`](./agent-ops) | Per-agent **entities**, pre-flight checks, dimensional usage metering, per-agent **deny budgets**, per-model **credit** debits + top-ups, spend breakdowns. |
| **Node (server SDK)** | [`node-server/`](./node-server) | `@monetizekit/node` — minimal classic-SaaS paywall + AI credits gate scripts. |
| **Next.js widgets** | [`nextjs/`](./nextjs) | `@monetizekit/react` — drop-in `PricingTable` + `Paywall` components. |

More frameworks (React/Vite, plain-HTML embed, and others) can be added as
sibling workspace packages — see [Adding an example](#adding-an-example).

## Repository layout

A [pnpm workspace](https://pnpm.io/workspaces): each example is a self-contained,
copy-paste-friendly package with its own `package.json` and README.

```bash
pnpm install        # install all examples
pnpm typecheck      # typecheck every example
pnpm build          # build every example (Node SDK + Next.js)
pnpm sdk:latest     # bump every example to the latest @monetizekit/* SDKs
```

## Staying aligned (CI/CD)

- **`CI`** (`.github/workflows/ci.yml`) — on every push/PR, installs and
  typechecks + builds every example, so a change never lands broken.
- **`SDK alignment`** (`.github/workflows/sdk-alignment.yml`) — daily, bumps
  `@monetizekit/*` to `@latest`, revalidates every example against them, and
  opens a PR with the update. A red run is an early signal that a new SDK/API
  release broke an example.
- **Dependabot** (`.github/dependabot.yml`) — weekly dependency + GitHub Actions
  updates as a safety net, grouping the `@monetizekit/*` packages together.

## Adding an example

1. Create a new directory (e.g. `react-vite/`) with its own `package.json`
   (name it `@monetizekit-examples/<framework>`).
2. Add it to `pnpm-workspace.yaml`.
3. Give it `typecheck` and `build` scripts so it joins the CI gate.
4. Depend on the relevant `@monetizekit/*` package(s) and add a short README.

## Configuration

Examples read a MonetizeKit **publishable** key (`pk_*`, browser-safe) or a
**secret** key (`mk_*`, server-only) plus your API base URL (default
`https://app.monetizekit.app`). See each example's README / `.env.example`.
