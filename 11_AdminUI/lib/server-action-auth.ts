import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, CREATIVE_ROLES, verifySessionToken } from "@/lib/auth";

async function redirectUnauthorized(): Promise<never> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  redirect("/login");
}

export async function requireAdminAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token))) {
    await redirectUnauthorized();
  }
}

export async function requireCreativeAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token, CREATIVE_ROLES))) {
    await redirectUnauthorized();
  }
}
