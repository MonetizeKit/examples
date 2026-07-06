import { cookies } from "next/headers";
import { sign, verify } from "./signing";

const FLEET_COOKIE = "ao_fleet";

export interface Fleet {
  customerId: string;
  meterId: string;
  agents: Array<{ entityId: string; name: string }>;
  budgetAgentEntityId: string;
}

export async function getFleet(): Promise<Fleet | null> {
  try {
    // Signed cookie — tampered or unsigned values read as absent.
    const raw = verify((await cookies()).get(FLEET_COOKIE)?.value);
    return raw ? (JSON.parse(raw) as Fleet) : null;
  } catch {
    return null;
  }
}

export async function setFleet(fleet: Fleet): Promise<void> {
  (await cookies()).set(FLEET_COOKIE, sign(JSON.stringify(fleet)), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });
}

export async function clearFleet(): Promise<void> {
  (await cookies()).delete(FLEET_COOKIE);
}
