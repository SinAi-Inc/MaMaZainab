import type { Metadata } from "next";
import { isPartnerPortalAuthenticated } from "@/lib/partners/auth";
import { readPartnerSettings } from "@/lib/partners/store";
import { readBranches } from "@/lib/branches/store";
import { PartnerPortal } from "./_components/partner-portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MaMa Zainab - Partner Portal",
  description:
    "Private MaMa Zainab partner presentation for malls, clubs, campuses, cinemas, hypermarkets, petrol stations, and compounds.",
};

export default async function PartnersPage() {
  const settings = await readPartnerSettings();
  const authenticated = await isPartnerPortalAuthenticated();

  const { branches } = authenticated ? await readBranches() : { branches: [] };
  const locations =
    authenticated && settings.featuredLocationIds.length > 0
      ? branches.filter((branch) => settings.featuredLocationIds.includes(branch.id))
      : authenticated
        ? branches
        : [];

  return (
    <PartnerPortal
      authenticated={authenticated}
      portalEnabled={settings.portalEnabled}
      showPresentation={settings.showPresentation}
      showLocations={settings.showLocations}
      showBrandOverview={settings.showBrandOverview}
      showMenu={settings.showMenu}
      presentationTitle={settings.presentationTitle}
      presentationSubtitle={settings.presentationSubtitle}
      presentationFileUrl={settings.presentationFileUrl}
      presentationVersion={settings.presentationVersion}
      presentationUpdatedAt={settings.presentationUpdatedAt}
      contactEmail={settings.contactEmail}
      contactPhone={settings.contactPhone}
      bookingUrl={settings.bookingUrl}
      assessmentUrl={settings.assessmentUrl}
      locations={locations.map((location) => ({
        id: location.id,
        name: location.name,
        area: location.district,
        city: location.city,
        status: location.status,
        address: location.address,
        type: `Kiosk #${location.kioskNumber}`,
      }))}
    />
  );
}
