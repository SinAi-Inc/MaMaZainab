import { promises as fs } from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_ROLES, verifySessionToken } from "@/lib/auth";
import { PARTNER_COOKIE_NAME, verifyPartnerSessionToken } from "@/lib/partners/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssetRouteContext = {
  params: Promise<{
    asset: string;
  }>;
};

const PROTECTED_ASSET_DIR = path.join(process.cwd(), "assets", "protected", "partners");

const PARTNER_ASSETS = {
  "mama-zainab-final": {
    filename: "mama-zainab-final-display.webp",
    downloadName: "mama-zainab-brand-host.webp",
    contentType: "image/webp",
  },
  "sheng-stamp": {
    filename: "sheng-stamp-display.webp",
    downloadName: "sheng-founder-seal.webp",
    contentType: "image/webp",
  },
  "sheng-founder-photo": {
    filename: "sheng-founder-photo-display.webp",
    downloadName: "sheng-founder-photo.webp",
    contentType: "image/webp",
  },
} as const;

async function canViewProtectedAsset(req: NextRequest) {
  const adminToken = req.cookies.get(COOKIE_NAME)?.value;
  if (adminToken && (await verifySessionToken(adminToken, SESSION_ROLES))) {
    return true;
  }

  const partnerToken = req.cookies.get(PARTNER_COOKIE_NAME)?.value;
  return Boolean(partnerToken && (await verifyPartnerSessionToken(partnerToken)));
}

function isPortalImageRequest(req: NextRequest) {
  const fetchDest = req.headers.get("sec-fetch-dest");
  const referer = req.headers.get("referer");
  if (fetchDest !== "image" || !referer) return false;

  try {
    const refererUrl = new URL(referer);
    return refererUrl.origin === req.nextUrl.origin && refererUrl.pathname === "/partner-portal";
  } catch {
    return false;
  }
}

function securityHeaders(asset: (typeof PARTNER_ASSETS)[keyof typeof PARTNER_ASSETS]) {
  return {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    "Content-Disposition": `inline; filename="${asset.downloadName}"`,
    "Content-Type": asset.contentType,
    Expires: "0",
    Pragma: "no-cache",
    "Referrer-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, noarchive, noimageindex",
  };
}

export async function GET(req: NextRequest, ctx: AssetRouteContext) {
  const { asset } = await ctx.params;
  const protectedAsset = PARTNER_ASSETS[asset as keyof typeof PARTNER_ASSETS];

  if (!protectedAsset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await canViewProtectedAsset(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPortalImageRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const file = await fs.readFile(path.join(PROTECTED_ASSET_DIR, protectedAsset.filename));

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: securityHeaders(protectedAsset),
  });
}
