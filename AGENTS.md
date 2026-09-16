# AGENTS.md

## Project overview

Official runnable MonetizeKit integration examples, kept aligned with the
latest SDKs by CI. pnpm workspace: `saas-taskflow/` (full SaaS lifecycle),
`agent-ops/` (agent entities, metering, credits), `node-server/`
(`@monetizekit/node`), `nextjs/` (`@monetizekit/react` widgets). `e2e/` holds
the Playwright lifecycle gate that drives the deployed TaskFlow and AgentOps
apps against the live API (Delivery).

## Commands

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`, `pnpm lint`, `pnpm build`
- `pnpm sdk:latest` re-pins every example to `@monetizekit/*@latest`
  (`.github/workflows/sdk-alignment.yml` does this daily and opens a PR)
- `pnpm test:e2e` (needs live credentials; `.github/workflows/e2e.yml` runs it
  nightly against Delivery)
- `pnpm sweep:demo` removes demo customers the E2E created

## Conventions

- Examples are copy-paste friendly: each package stands alone with its own
  `package.json` and README; no shared internal helpers.
- Every example demonstrates the purchasing gate (entitlement or credit check
  that allows or blocks access) and is exercised by the lifecycle E2E.
- E2E test data is unique per run and cleaned up; reruns must be idempotent.

## Verifying your work

```
$ pnpm typecheck
Scope: 4 of 5 workspace projects
node-server typecheck: Done
nextjs typecheck: Done
agent-ops typecheck: Done
saas-taskflow typecheck: Done

$ pnpm lint
agent-ops lint: Done
saas-taskflow lint: Done
nextjs lint: Done
```

## SDLC and promotion chain

- Branches: `feature/*` -> PR -> `development` -> `delivery` -> `main`. Feature
  PRs target `development`. Promotion between stages is a promotion PR from
  the upstream stage branch (`development -> delivery`, `delivery -> main`);
  where this repository has `.github/workflows/promote.yml`, that workflow
  opens it when the stage gate is green, and `delivery -> main` is always
  merged by a human. Never open a feature PR against `main` or `delivery`.
- Every PR must pass the `Required Checks Gate` job in `.github/workflows/ci.yml`.
  The `Shadow Review (advisory)` job posts a model review comment; it never
  blocks. React with a thumbs-down to dismiss a finding.
- Agent roles, model IDs, tools and autonomy for the whole fleet are declared in
  [`MonetizeKit/.github/agent-policy.json`](https://github.com/MonetizeKit/.github/blob/main/agent-policy.json).
  Never hardcode a model ID in this repository.
- Conventional commits (`feat:`, `fix:`, `chore:`, ...). Position and status live
  in Linear (team `MK`); reference the issue key in the PR body when one exists.
- The fleet-wide plan is
  [`docs/engineering/ai-native-sdlc-plan.md`](https://github.com/MonetizeKit/app-monetizekit-monorepo/blob/main/docs/engineering/ai-native-sdlc-plan.md)
  in the monorepo.
