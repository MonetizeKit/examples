/**
 * HMAC signing for the fleet session cookie. The cookie's customer/entity ids
 * authorize usage submission, credit debits, and reset/delete, so a forged
 * cookie must not be accepted — sign the value and reject anything that fails
 * verification.
 *
 * The signing key is derived from the server's secret API key, so no extra
 * secret needs provisioning; rotating the API key invalidates old sessions,
 * which is acceptable for a demo.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SIGNING_KEY = createHash("sha256")
  .update(`agentops-session:${process.env.MONETIZEKIT_EXAMPLES_API_KEY ?? process.env.MONETIZEKIT_API_KEY ?? "unconfigured"}`)
  .digest();

function mac(value: string): string {
  return createHmac("sha256", SIGNING_KEY).update(value).digest("base64url");
}

export function sign(value: string): string {
  return `${Buffer.from(value).toString("base64url")}.${mac(value)}`;
}

export function verify(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;
  let value: string;
  try {
    value = Buffer.from(signed.slice(0, dot), "base64url").toString();
  } catch {
    return null;
  }
  const given = Buffer.from(signed.slice(dot + 1));
  const expected = Buffer.from(mac(value));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return value;
}
