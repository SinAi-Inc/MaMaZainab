import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_ROLES, verifySessionToken } from "@/lib/auth";
import { readBranches } from "@/lib/branches/store";
import { readBrandMedia } from "@/lib/brand-media/store";
import { PARTNER_COOKIE_NAME, verifyPartnerSessionToken } from "@/lib/partners/auth";
import { buildPartnerPresentationPdf } from "@/lib/partners/pdf";
import { readStoredPartnerSettings } from "@/lib/partners/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function canDownloadDeck() {
  const jar = await cookies();
  const adminToken = jar.get(COOKIE_NAME)?.value;
  if (adminToken && (await verifySessionToken(adminToken, SESSION_ROLES))) return true;

  const partnerToken = jar.get(PARTNER_COOKIE_NAME)?.value;
  return Boolean(partnerToken && (await verifyPartnerSessionToken(partnerToken)));
}

export async function GET() {
  if (!(await canDownloadDeck())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "Content-Disposition": `attachment; filename="MaMa-Zainab-Partner-Deck-${today}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, noarchive",
    },
  });
}
