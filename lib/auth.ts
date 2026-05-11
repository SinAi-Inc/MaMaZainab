import { SignJWT, jwtVerify } from "jose";
import { readSettings } from "@/lib/settings/store";

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
    const { payload } = await jwtVerify(token, getSecret());

    // Reject tokens issued before the session floor ("end all sessions")
    const settings = await readSettings();
    if (settings.sessionFloor) {
      const floor = Math.floor(new Date(settings.sessionFloor).getTime() / 1000);
      if ((payload.iat ?? 0) < floor) return false;
    }

    return true;
  } catch {
    return false;
  }
}
