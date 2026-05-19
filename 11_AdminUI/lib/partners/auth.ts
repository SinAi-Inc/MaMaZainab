import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const PARTNER_COOKIE_NAME = "mz_partner_session";
export const PARTNER_MAX_AGE_SECONDS = 60 * 60 * 8;

const HASH_PREFIX = "scrypt";

function getPartnerSecret(): Uint8Array {
  const secret = process.env.PARTNER_JWT_SECRET ?? process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("PARTNER_JWT_SECRET or ADMIN_JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export function hashPartnerPasscode(passcode: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(passcode, salt, 64).toString("hex");
  return `${HASH_PREFIX}$${salt}$${hash}`;
}

export function isHashedPartnerPasscode(storedPasscode: string): boolean {
  return storedPasscode.startsWith(`${HASH_PREFIX}$`);
}

export function verifyPartnerPasscodeValue(candidate: string, storedPasscode: string): boolean {
  if (!storedPasscode) return false;

  if (isHashedPartnerPasscode(storedPasscode)) {
    const [, salt, expectedHash] = storedPasscode.split("$");
    if (!salt || !expectedHash) return false;

    const actualHash = scryptSync(candidate, salt, 64);
    const expected = Buffer.from(expectedHash, "hex");
    return actualHash.length === expected.length && timingSafeEqual(actualHash, expected);
  }

  const input = Buffer.from(candidate);
  const expected = Buffer.from(storedPasscode);
  return input.length === expected.length && timingSafeEqual(input, expected);
}

export async function createPartnerSessionToken(): Promise<string> {
  return new SignJWT({ role: "partner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PARTNER_MAX_AGE_SECONDS}s`)
    .sign(getPartnerSecret());
}

export async function verifyPartnerSessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getPartnerSecret());
    return payload.role === "partner";
  } catch {
    return false;
  }
}

export async function setPartnerSessionCookie(): Promise<void> {
  const token = await createPartnerSessionToken();
  const jar = await cookies();
  jar.set(PARTNER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PARTNER_MAX_AGE_SECONDS,
    path: "/partner-portal",
  });
}

export async function clearPartnerSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(PARTNER_COOKIE_NAME);
}

export async function isPartnerPortalAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(PARTNER_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyPartnerSessionToken(token);
}