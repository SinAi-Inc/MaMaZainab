import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "mz_admin_session";
export const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s) throw new Error("ADMIN_JWT_SECRET env var is not set");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}
