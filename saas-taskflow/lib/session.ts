import { cookies } from "next/headers";

const CUSTOMER_COOKIE = "tf_customer_id";
const MEMBERS_COOKIE = "tf_members";
const SUB_COOKIE = "tf_subscription";

export interface SubState {
  id: string;
  status: string;
  planId: string;
  trialEnd?: string | null;
}

export async function getSub(): Promise<SubState | null> {
  try {
    const raw = (await cookies()).get(SUB_COOKIE)?.value;
    return raw ? (JSON.parse(raw) as SubState) : null;
  } catch {
    return null;
  }
}

export async function setSub(sub: SubState | null): Promise<void> {
  const store = await cookies();
  if (!sub) store.delete(SUB_COOKIE);
  else store.set(SUB_COOKIE, JSON.stringify(sub), { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function getCustomerId(): Promise<string | null> {
  return (await cookies()).get(CUSTOMER_COOKIE)?.value ?? null;
}

export async function setCustomerId(id: string): Promise<void> {
  (await cookies()).set(CUSTOMER_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
  store.delete(MEMBERS_COOKIE);
  store.delete(SUB_COOKIE);
}

/** Demo team roster — app-side state; the seat LIMIT comes from MonetizeKit. */
export async function getMembers(): Promise<string[]> {
  try {
    return JSON.parse((await cookies()).get(MEMBERS_COOKIE)?.value ?? "[]") as string[];
  } catch {
    return [];
  }
}

export async function setMembers(members: string[]): Promise<void> {
  (await cookies()).set(MEMBERS_COOKIE, JSON.stringify(members), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
