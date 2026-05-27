import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function requireAdminAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token))) {
    throw new Error("Unauthorized");
  }
}
