"use server";

import {
  clearPartnerSessionCookie,
  hashPartnerPasscode,
  isHashedPartnerPasscode,
  setPartnerSessionCookie,
  verifyPartnerPasscodeValue,
} from "./auth";
import { checkServerActionRateLimit } from "@/lib/rate-limit";
import { requireAdminOrCreativeAction } from "@/lib/server-action-auth";
import { readBranches } from "@/lib/branches/store";
import { readBrandMedia } from "@/lib/brand-media/store";
import { uploadBuffer } from "@/lib/upload";
import {
  readPartnerSettings,
  readStoredPartnerSettings,
  writeStoredPartnerSettings,
} from "./store";
import { buildPartnerPresentationPdf } from "./pdf";
import type { PartnerSettings } from "./schema";

export async function getPartnerSettings() {
  await requireAdminOrCreativeAction();
  return readPartnerSettings();
}

export async function updatePartnerSettings(
  settings: PartnerSettings,
): Promise<{ data?: PartnerSettings; error?: string }> {
  try {
    await requireAdminOrCreativeAction();
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

export async function generatePartnerPresentationPdf(): Promise<{ data?: PartnerSettings; url?: string; error?: string }> {
  try {
    await requireAdminOrCreativeAction();
    const [settings, branchesState, mediaState] = await Promise.all([
      readStoredPartnerSettings(),
      readBranches(),
      readBrandMedia(),
    ]);
    const pdf = buildPartnerPresentationPdf({
      settings,
      branches: branchesState.branches,
      mediaAssets: mediaState.assets,
    });
    const today = new Date().toISOString().slice(0, 10);
    const url = await uploadBuffer({
      buffer: pdf,
      filename: `MaMa-Zainab-Partner-Deck-${today}.pdf`,
      contentType: "application/pdf",
      subdir: "partner-decks",
      allowedExts: ["pdf"],
      maxBytes: 5 * 1024 * 1024,
    });

    await writeStoredPartnerSettings({
      ...settings,
      presentationFileUrl: url,
      presentationUpdatedAt: today,
    });

    const data = await readPartnerSettings();
    return { data, url };
  } catch (err) {
    console.error("[generatePartnerPresentationPdf]", err);
    return { error: err instanceof Error ? err.message : String(err) };
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
