import { cookies } from "next/headers";
import { sign, verify } from "./signing";

const CUSTOMER_COOKIE = "tf_customer_id";
const MEMBERS_COOKIE = "tf_members";
const SUB_COOKIE = "tf_subscription";

const COOKIE_OPTS = { httpOnly: true, sameSite: "lax", secure: true, path: "/" } as const;

export interface SubState {
  id: string;
  status: string;
  planId: string;
  trialEnd?: string | null;
}

/** Read a signed cookie; tampered or unsigned values read as absent. */
async function readSigned(name: string): Promise<string | null> {
  return verify((await cookies()).get(name)?.value);
}

export async function getSub(): Promise<SubState | null> {
  try {
    const raw = await readSigned(SUB_COOKIE);
    return raw ? (JSON.parse(raw) as SubState) : null;
  } catch {
    return null;
  }
}

export async function setSub(sub: SubState | null): Promise<void> {
  const store = await cookies();
  if (!sub) store.delete(SUB_COOKIE);
  else store.set(SUB_COOKIE, sign(JSON.stringify(sub)), COOKIE_OPTS);
}

export async function getCustomerId(): Promise<string | null> {
  return readSigned(CUSTOMER_COOKIE);
}

export async function setCustomerId(id: string): Promise<void> {
  (await cookies()).set(CUSTOMER_COOKIE, sign(id), COOKIE_OPTS);
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
    const raw = await readSigned(MEMBERS_COOKIE);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function setMembers(members: string[]): Promise<void> {
  (await cookies()).set(MEMBERS_COOKIE, sign(JSON.stringify(members)), COOKIE_OPTS);
}
