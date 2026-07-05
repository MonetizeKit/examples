# TaskFlow — standard feature SaaS (with add-ons)

A **complete lifecycle** example of a feature-gated SaaS built on MonetizeKit.
The app stores no monetization state — every gate is resolved live against the
MonetizeKit API using a server-side secret key.

## The lifecycle it demonstrates

1. **Sign up** — creates a real customer (`POST /customers`); a no-plan customer
   is fully gated.
2. **Trial / subscribe** — pick a plan on `/pricing` (`POST /subscriptions`);
   plans with `trialDays` start `trialing`.
3. **Feature + limit gating** — the workspace enforces the `seats` **limit**
   (inviting past the entitlement is blocked with an upgrade prompt) and the
   `advanced_analytics` **boolean** (premium section locked until entitled).
4. **Add-ons** — `/app/addons` attaches/detaches add-ons via
   `POST/DELETE /customers/{id}/addons/*`; the Extra Seats Pack raises the seat
   limit (+10 delta), Priority Support upgrades the enum tier. Plan
   compatibility is enforced server-side (attaching on Free is rejected).
5. **Upgrade / downgrade** — switch plans in place (`PATCH /subscriptions/{id}`).
6. **Cancel** — `DELETE /subscriptions/{id}`; gates snap back to no-plan.

`/app/billing` shows the **live entitlement resolution table** (plan value →
add-on delta → effective value, with sources) — the same numbers driving the gates.

## Run

```bash
pnpm install
cp .env.example .env.local   # set your secret key
pnpm --filter @monetizekit-examples/saas-taskflow dev
```

Point `NEXT_PUBLIC_MONETIZEKIT_API_BASE_URL` at your instance and use a secret (`mk_*`) key for
a workspace whose catalog has the Example Product plans + add-ons (the
`MonetizeKit Examples` workspace ships them out of the box).
