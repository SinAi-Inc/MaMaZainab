"use server";

import {
  clearPartnerSessionCookie,
  hashPartnerPasscode,
  isHashedPartnerPasscode,
  setPartnerSessionCookie,
  verifyPartnerPasscodeValue,
} from "./auth";
import { checkServerActionRateLimit } from "@/lib/rate-limit";
import { requireAdminAction } from "@/lib/server-action-auth";
import {
  readPartnerSettings,
  readStoredPartnerSettings,
  writeStoredPartnerSettings,
} from "./store";
import type { PartnerSettings } from "./schema";

export async function getPartnerSettings() {
  await requireAdminAction();
  return readPartnerSettings();
}

export async function updatePartnerSettings(
  settings: PartnerSettings,
): Promise<{ data?: PartnerSettings; error?: string }> {
  try {
    await requireAdminAction();
    const current = await readStoredPartnerSettings();
    const trimmedPasscode = settings.passcode.trim();

    await writeStoredPartnerSettings({
      portalEnabled: settings.portalEnabled,
      showPresentation: settings.showPresentation,
      showLocations: settings.showLocations,
      showBrandOverview: settings.showBrandOverview,
      showMenu: settings.showMenu,
      featuredLocationIds: settings.featuredLocationIds,
      presentationTitle: settings.presentationTitle,
      presentationSubtitle: settings.presentationSubtitle,
      presentationFileUrl: settings.presentationFileUrl,
      presentationVersion: settings.presentationVersion,
      presentationUpdatedAt: settings.presentationUpdatedAt,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      bookingUrl: settings.bookingUrl,
      assessmentUrl: settings.assessmentUrl,
      passcode: trimmedPasscode ? hashPartnerPasscode(trimmedPasscode) : current.passcode,
      passcodeConfigured: false,
    });

    const data = await readPartnerSettings();
    return { data };
  } catch (err) {
    console.error("[updatePartnerSettings]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

export async function authenticatePartnerPortal(code: string): Promise<boolean> {
  const limit = await checkServerActionRateLimit("partner-auth", {
    windowMs: 60_000,
    maxHits: 5,
  });
  if (limit.limited) return false;

  const settings = await readStoredPartnerSettings();
  if (!settings.portalEnabled) return false;
  if (!settings.passcode) return false;

  const ok = verifyPartnerPasscodeValue(code, settings.passcode);
  if (!ok) {
    await clearPartnerSessionCookie();
    return false;
  }

  if (!isHashedPartnerPasscode(settings.passcode)) {
    await writeStoredPartnerSettings({
      ...settings,
      passcode: hashPartnerPasscode(code),
      passcodeConfigured: false,
    });
  }

  await setPartnerSessionCookie();
  return true;
}
