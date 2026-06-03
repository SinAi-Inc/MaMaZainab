import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_ROLES,
  COOKIE_NAME,
  CREATIVE_ROLES,
  SESSION_ROLES,
  type SessionRole,
  readSessionToken,
  verifySessionToken,
} from "@/lib/auth";

async function redirectUnauthorized(): Promise<never> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  redirect("/login");
}

async function requireActionRole(allowedRoles: readonly SessionRole[]): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (!token) {
    await redirectUnauthorized();
    return;
  }

  if (await verifySessionToken(token, allowedRoles)) return;

  const session = await readSessionToken(token, SESSION_ROLES);
  if (!session) {
    await redirectUnauthorized();
    return;
  }

  redirect(session.role === "art_director" ? "/ai" : "/dashboard");
}

export async function requireAdminAction(): Promise<void> {
  await requireActionRole(ADMIN_ROLES);
}

export async function requireCreativeAction(): Promise<void> {
  await requireActionRole(CREATIVE_ROLES);
}

export async function requireAdminOrCreativeAction(): Promise<void> {
  await requireActionRole(SESSION_ROLES);
}
