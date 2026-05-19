"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SettingsSchema } from "./schema";
import { readSettings, writeSettings } from "./store";
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from "@/lib/auth";

export async function saveSettings(formData: FormData) {
  const raw = {
    userName: formData.get("userName"),
    email: formData.get("email"),
    primaryLanguage: formData.get("primaryLanguage"),
    secondaryLanguage: formData.get("secondaryLanguage"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    notifyMenuChanges: formData.get("notifyMenuChanges") === "on",
    notifyVideoUpdates: formData.get("notifyVideoUpdates") === "on",
    notifyMaintenance: formData.get("notifyMaintenance") === "on",
    sessionTimeout: formData.get("sessionTimeout"),
  };

  const parsed = SettingsSchema.parse(raw);
  await writeSettings(parsed);
  revalidatePath("/settings");
}

/**
 * End all sessions except the current one.
 * Sets sessionFloor to now (invalidating older tokens), then re-issues
 * a fresh JWT for the caller so they stay logged in.
 */
export async function terminateOtherSessions(): Promise<{ ok: boolean; error?: string }> {
  try {
    const settings = await readSettings();
    settings.sessionFloor = new Date().toISOString();
    await writeSettings(settings);

    // Re-issue a fresh token for the current session
    const token = await createSessionToken();
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
