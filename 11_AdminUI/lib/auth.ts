import { SignJWT, jwtVerify } from "jose";
import { readSettings } from "@/lib/settings/store";

export const COOKIE_NAME = "mz_admin_session";
export const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
export const SESSION_ROLES = ["admin", "art_director"] as const;
export type SessionRole = (typeof SESSION_ROLES)[number];
export type SessionUser = {
  role: SessionRole;
  email?: string;
};

export const ADMIN_ROLES: readonly SessionRole[] = ["admin"];
export const CREATIVE_ROLES: readonly SessionRole[] = ["art_director"];

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s) throw new Error("ADMIN_JWT_SECRET env var is not set");
  return new TextEncoder().encode(s);
}

function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === "string" && SESSION_ROLES.includes(value as SessionRole);
}

export async function createSessionToken(
  role: SessionRole = "admin",
  email?: string,
): Promise<string> {
  return new SignJWT({ role, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function readSessionToken(
  token: string,
  allowedRoles: readonly SessionRole[] = ADMIN_ROLES,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role;
    if (!isSessionRole(role) || !allowedRoles.includes(role)) return null;
    const email = typeof payload.email === "string" ? payload.email : undefined;

    // Reject tokens issued before the session floor ("end all sessions")
    const settings = await readSettings();
    if (settings.sessionFloor) {
      const floor = Math.floor(new Date(settings.sessionFloor).getTime() / 1000);
      if ((payload.iat ?? 0) < floor) return null;
    }

    return { role, email };
  } catch {
    return null;
  }
}

export async function verifySessionToken(
  token: string,
  allowedRoles: readonly SessionRole[] = ADMIN_ROLES,
): Promise<boolean> {
  return Boolean(await readSessionToken(token, allowedRoles));
}
