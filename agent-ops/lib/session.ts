import { cookies } from "next/headers";

const FLEET_COOKIE = "ao_fleet";

export interface Fleet {
  customerId: string;
  meterId: string;
  agents: Array<{ entityId: string; name: string }>;
  budgetAgentEntityId: string;
}

export async function getFleet(): Promise<Fleet | null> {
  try {
    const raw = (await cookies()).get(FLEET_COOKIE)?.value;
    return raw ? (JSON.parse(raw) as Fleet) : null;
  } catch {
    return null;
  }
}

export async function setFleet(fleet: Fleet): Promise<void> {
  (await cookies()).set(FLEET_COOKIE, JSON.stringify(fleet), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearFleet(): Promise<void> {
  (await cookies()).delete(FLEET_COOKIE);
}
