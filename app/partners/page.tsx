import type { Metadata } from "next";
import { readPartnerSettings } from "@/lib/partners/store";
import { readBranches } from "@/lib/branches/store";
import { PartnerPortal } from "./_components/partner-portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MaMa Zainab — Partner Portal",
  description:
    "Exclusive access for MaMa Zainab kiosk partners — malls, landmarks, and retail locations.",
};

export default async function PartnersPage() {
  const settings = await readPartnerSettings();
  const { branches } = await readBranches();

  // Filter to featured locations only (if configured), otherwise show all
  const locations =
    settings.featuredLocationIds.length > 0
      ? branches.filter((b) => settings.featuredLocationIds.includes(b.id))
      : branches;

  return (
    <PartnerPortal
      portalEnabled={settings.portalEnabled}
      showPresentation={settings.showPresentation}
      showLocations={settings.showLocations}
      showBrandOverview={settings.showBrandOverview}
      showMenu={settings.showMenu}
      locations={locations}
    />
  );
}
