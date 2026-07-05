/**
 * Minimal server-side MonetizeKit REST client (secret key — never expose to the
 * browser). All monetization state lives in MonetizeKit; this app stores only a
 * session cookie referencing the demo customer.
 */
const BASE_URL = process.env.MONETIZEKIT_BASE_URL ?? "https://app.monetizekit.app";
const API_KEY = process.env.MONETIZEKIT_EXAMPLES_API_KEY ?? process.env.MONETIZEKIT_API_KEY ?? "";

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
  const url = `${BASE_URL}/api/v1${path}`;
  console.log(`[mk] ${init?.method ?? "GET"} ${url}`, { hasKey: !!API_KEY, keyPrefix: API_KEY.substring(0, 7) });
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  console.log(`[mk] Response: ${res.status} ${res.statusText}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string } | string;
      message?: string;
    };
    console.log(`[mk] Error body:`, body);
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
