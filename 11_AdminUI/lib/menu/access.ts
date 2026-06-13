import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { PARTNER_COOKIE_NAME, verifyPartnerSessionToken } from "@/lib/partners/auth";
import { readSettings } from "@/lib/settings/store";

export async function canViewPublicMenu(): Promise<boolean> {
  const settings = await readSettings();
  if (settings.allowPublicMenu) return true;

  const jar = await cookies();
  const adminToken = jar.get(COOKIE_NAME)?.value;
  if (adminToken && (await verifySessionToken(adminToken))) return true;

  const partnerToken = jar.get(PARTNER_COOKIE_NAME)?.value;
  return Boolean(partnerToken && (await verifyPartnerSessionToken(partnerToken)));
}
