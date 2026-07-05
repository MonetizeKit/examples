/**
 * Minimal server-side MonetizeKit REST client (secret key — never expose to the
 * browser). All monetization state lives in MonetizeKit; this app stores only a
 * session cookie referencing the demo customer.
 */
const BASE_URL = process.env.MONETIZEKIT_BASE_URL ?? "https://app.monetizekit.app";
const API_KEY = process.env.MONETIZEKIT_EXAMPLES_API_KEY ?? process.env.MONETIZEKIT_API_KEY ?? "";
// The MonetizeKit dashboard's non-production stages (dev/delivery) sit behind
// Vercel Deployment Protection (SSO). This automation-bypass token lets a
// server-to-server call through without a human SSO session — it is never
// exposed to the browser. Unset (and unnecessary) in production.
const PROTECTION_BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export class MkError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function mk<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      // NOTE: deliberately omit `x-vercel-set-bypass-cookie` — that flag puts
      // Vercel into a redirect-and-set-cookie flow meant for a persistent
      // browser cookie jar. A stateless server `fetch()` has no cookie jar
      // across requests, so the header alone (which bypasses inline, no
      // redirect) is what actually works here.
      ...(PROTECTION_BYPASS ? { "x-vercel-protection-bypass": PROTECTION_BYPASS } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string } | string;
      message?: string;
    };
    const err = typeof body.error === "object" ? body.error : undefined;
    throw new MkError(
      res.status,
      err?.code ?? (typeof body.error === "string" ? body.error : "error"),
      err?.message ?? body.message ?? `MonetizeKit API ${res.status} for ${path}`,
    );
  }
  return (await res.json()) as T;
}

export interface Entitlement {
  featureKey: string;
  featureDisplayName: string;
  type: string;
  effectiveValue: string | number | boolean;
  planValue: string | number | boolean;
  addOnDelta: number | boolean | null;
  sources: string[];
}

export async function getEntitlements(customerId: string): Promise<Entitlement[]> {
  const res = await mk<{ data?: Entitlement[] } | Entitlement[]>(`/entitlements/${customerId}`);
  return Array.isArray(res) ? res : (res.data ?? []);
}
