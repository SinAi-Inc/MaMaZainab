"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SettingsSchema } from "./schema";
import { readSettings, writeSettings } from "./store";
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from "@/lib/auth";
import { requireAdminAction } from "@/lib/server-action-auth";

export async function saveSettings(formData: FormData) {
  await requireAdminAction();
  // Read existing first so system-managed fields (sessionFloor) are preserved
  // and so checkbox "off" states (absent from FormData) don't silently revert booleans.
  const existing = await readSettings();

  const raw = {
    // Account
    userName: formData.get("userName") ?? existing.userName,
    email: formData.get("email") ?? existing.email,
    // Localization
    primaryLanguage: formData.get("primaryLanguage") ?? existing.primaryLanguage,
    secondaryLanguage: formData.get("secondaryLanguage") ?? existing.secondaryLanguage,
    currency: formData.get("currency") ?? existing.currency,
    timezone: formData.get("timezone") ?? existing.timezone,
    // Notifications
    notifyMenuChanges: formData.get("notifyMenuChanges") === "on",
    notifyVideoUpdates: formData.get("notifyVideoUpdates") === "on",
    notifyMaintenance: formData.get("notifyMaintenance") === "on",
    // API Management
    orderingApiUrl: formData.get("orderingApiUrl") ?? existing.orderingApiUrl,
    orderingApiEnabled: formData.get("orderingApiEnabled") === "on",
    posApiUrl: formData.get("posApiUrl") ?? existing.posApiUrl,
    posApiEnabled: formData.get("posApiEnabled") === "on",
    deliveryApiUrl: formData.get("deliveryApiUrl") ?? existing.deliveryApiUrl,
    deliveryApiEnabled: formData.get("deliveryApiEnabled") === "on",
    // Social Media
    socialFacebook: formData.get("socialFacebook") ?? existing.socialFacebook,
    socialInstagram: formData.get("socialInstagram") ?? existing.socialInstagram,
    socialTiktok: formData.get("socialTiktok") ?? existing.socialTiktok,
    socialTwitter: formData.get("socialTwitter") ?? existing.socialTwitter,
    socialYoutube: formData.get("socialYoutube") ?? existing.socialYoutube,
    socialWhatsapp: formData.get("socialWhatsapp") ?? existing.socialWhatsapp,
    // Security
    sessionTimeout: formData.get("sessionTimeout") ?? existing.sessionTimeout,
    requirePassword: formData.get("requirePassword") === "on",
    adminPassword: formData.get("adminPassword") ?? existing.adminPassword,
    allowPublicMenu: formData.get("allowPublicMenu") === "on",
    // System-managed - never overwritten by a form save
    sessionFloor: existing.sessionFloor,
  };

  const parsed = SettingsSchema.parse(raw);
  await writeSettings(parsed);
  revalidatePath("/settings");
  revalidatePath("/coming-soon");
}

/**
 * End all sessions except the current one.
 * Sets sessionFloor to now (invalidating older tokens), then re-issues
 * a fresh JWT for the caller so they stay logged in.
 */
export async function terminateOtherSessions(): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdminAction();
    const settings = await readSettings();
    settings.sessionFloor = new Date().toISOString();
    await writeSettings(settings);

    // Re-issue a fresh token for the current session
    const token = await createSessionToken("admin", settings.email);
    const jar = await cookies();
    jar.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE_SECONDS,
      path: "/",
    });

    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
