"use server";

import { readPartnerSettings, writePartnerSettings } from "./store";
import type { PartnerSettings } from "./schema";

export async function getPartnerSettings() {
  return readPartnerSettings();
}

export async function updatePartnerSettings(
  settings: PartnerSettings,
): Promise<{ data?: PartnerSettings; error?: string }> {
  try {
    await writePartnerSettings(settings);
    const data = await readPartnerSettings();
    return { data };
  } catch (err) {
    console.error("[updatePartnerSettings]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export async function verifyPartnerPasscode(code: string): Promise<boolean> {
  const settings = await readPartnerSettings();
  if (!settings.portalEnabled) return false;
  if (!settings.passcode) return false;
  return code === settings.passcode;
}
