"use server";

import { readPartnerSettings, writePartnerSettings } from "./store";
import type { PartnerSettings } from "./schema";

export async function getPartnerSettings() {
  return readPartnerSettings();
}

export async function updatePartnerSettings(settings: PartnerSettings) {
  await writePartnerSettings(settings);
  return readPartnerSettings();
}

export async function verifyPartnerPasscode(code: string): Promise<boolean> {
  const settings = await readPartnerSettings();
  if (!settings.portalEnabled) return false;
  if (!settings.passcode) return false;
  return code === settings.passcode;
}
