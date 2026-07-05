# AgentOps — volume-based agent-style application

A **complete lifecycle** example of volume/agent monetization built on
MonetizeKit's AI usage runtime. Every gate is enforced live by the API; the app
stores only a session cookie.

## The lifecycle it demonstrates

1. **Provision a fleet** — creates a customer, two **agent entities**
   (`POST /customers/{id}/entities`), a per-agent **deny budget** (10
   actions/month on the Researcher via `POST /budgets` with `entityId`), and a
   25-credit starter pack (`POST /credits/grant`).
2. **Pre-flight** — before every action, `POST /entitlements/preflight` checks
   the budget headroom and credit balance in one call.
3. **Dimensional metering** — each action submits usage attributed to the agent
   (`subjectId`) with a `model` dimension (`POST /usage/events`).
4. **Budget gate** — the Researcher's 11th action of the month is **denied**
   (`402 BUDGET_EXCEEDED`); the Summarizer (no budget) keeps running.
5. **Credit gate** — each action debits per-model credits (gpt-4o = 5,
   gpt-4o-mini = 1, mirroring the meter's `creditCost`); an unaffordable action
   is blocked with a top-up prompt (`POST /credits/grant` buys another pack).
6. **Spend reporting** — `/usage` shows the per-model breakdown with
   server-computed credit costs (`GET /usage/{cId}/{mId}/breakdown?dimension=model`)
   and the live credit balance.

## Run

```bash
pnpm install
cp .env.example .env.local   # set your secret key
pnpm --filter @monetizekit-examples/agent-ops dev
```

Requires a workspace whose catalog has the `agent_actions` meter with per-model
`creditCost` (the `MonetizeKit Examples` workspace ships it out of the box).
