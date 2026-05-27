import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import {
  BrandMediaAssetSchema,
  BrandMediaStateSchema,
  type BrandMediaAsset,
  type BrandMediaState,
} from "./schema";

const FILE = path.join(process.cwd(), "data", "brand-media.json");
const DATA_DIR = path.join(process.cwd(), "data");

const now = "2026-05-27";

const SEEDED_ASSETS: BrandMediaAsset[] = [
  {
    id: "asset_partner_kiosk",
    title: "MaMa Zainab kiosk render",
    description: "Existing brand kiosk render used as partner cover and kiosk-format fallback.",
    url: "/brand/partners/kiosk.png",
    thumbnailUrl: "/brand/partners/kiosk.png",
    alt: "MaMa Zainab branded green and yellow kiosk render",
    category: "kiosk",
    usage: "partner_cover",
    slideId: "cover",
    isActive: true,
    sortOrder: 10,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "asset_partner_kiosk_format",
    title: "Kiosk format visual",
    description: "Kiosk visual for the format slide.",
    url: "/brand/partners/kiosk.png",
    thumbnailUrl: "/brand/partners/kiosk.png",
    alt: "Compact MaMa Zainab kiosk format",
    category: "kiosk",
    usage: "slide_visual",
    slideId: "format",
    isActive: true,
    sortOrder: 20,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "asset_partner_packaging_box",
    title: "Packaging box proof",
    description: "Existing packaging proof for brand slide support.",
    url: "/brand/partners/packaging-box.jpeg",
    thumbnailUrl: "/brand/partners/packaging-box.jpeg",
    alt: "MaMa Zainab branded packaging box",
    category: "packaging",
    usage: "brand_overview",
    slideId: "brand",
    isActive: true,
    sortOrder: 30,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "asset_partner_packaging_takeaway",
    title: "Takeaway packaging proof",
    description: "Existing takeaway package proof for brand slide support.",
    url: "/brand/partners/packaging-takeaway.jpeg",
    thumbnailUrl: "/brand/partners/packaging-takeaway.jpeg",
    alt: "MaMa Zainab takeaway package",
    category: "packaging",
    usage: "brand_overview",
    slideId: "brand",
    isActive: true,
    sortOrder: 40,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "asset_partner_packaging_canholder",
    title: "Can holder proof",
    description: "Existing can holder proof for brand slide support.",
    url: "/brand/partners/packaging-canholder.jpeg",
    thumbnailUrl: "/brand/partners/packaging-canholder.jpeg",
    alt: "MaMa Zainab branded can holder",
    category: "packaging",
    usage: "brand_overview",
    slideId: "brand",
    isActive: true,
    sortOrder: 50,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "asset_partner_kiosk_sauces",
    title: "Kiosk sauces packaging",
    description: "Existing sauce packaging proof for menu support and CTA visuals.",
    url: "/brand/partners/kiosk-sauces.jpeg",
    thumbnailUrl: "/brand/partners/kiosk-sauces.jpeg",
    alt: "MaMa Zainab branded sauces near kiosk packaging",
    category: "packaging",
    usage: "menu_support",
    slideId: "cta",
    isActive: true,
    sortOrder: 60,
    createdAt: now,
    updatedAt: now,
  },
];

function mergeSeedAssets(assets: BrandMediaAsset[]): BrandMediaAsset[] {
  const seen = new Set(assets.map((asset) => asset.id));
  return [...assets, ...SEEDED_ASSETS.filter((asset) => !seen.has(asset.id))].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

async function readJson(): Promise<BrandMediaState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = BrandMediaStateSchema.parse(JSON.parse(raw));
    return { assets: mergeSeedAssets(parsed.assets) };
  } catch {
    return { assets: SEEDED_ASSETS };
  }
}

async function writeJson(state: BrandMediaState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify({ assets: state.assets }, null, 2), "utf8");
}

function rowToAsset(row: Record<string, unknown>): BrandMediaAsset {
  const camel = toCamel(row) as Record<string, unknown>;
  return BrandMediaAssetSchema.parse(camel);
}

function assetToRow(asset: BrandMediaAsset): Record<string, unknown> {
  return toSnake(asset as unknown as Record<string, unknown>);
}

export async function readBrandMedia(): Promise<BrandMediaState> {
  if (!isSupabaseConfigured()) return readJson();

  const { data, error } = await getSupabase()
    .from("brand_media_assets")
    .select("*")
    .order("sort_order");

  if (error) return { assets: SEEDED_ASSETS };
  return {
    assets: mergeSeedAssets((data ?? []).map((row) => rowToAsset(row as unknown as Record<string, unknown>))),
  };
}

export async function writeBrandMediaAsset(asset: BrandMediaAsset): Promise<void> {
  const parsed = BrandMediaAssetSchema.parse(asset);

  if (!isSupabaseConfigured()) {
    const state = await readJson();
    const index = state.assets.findIndex((item) => item.id === parsed.id);
    if (index >= 0) state.assets[index] = parsed;
    else state.assets.push(parsed);
    await writeJson(state);
    return;
  }

  const { error } = await getSupabase()
    .from("brand_media_assets")
    .upsert(assetToRow(parsed), { onConflict: "id" });
  if (error) throw new Error(`Supabase ${error.code ?? "error"}: ${error.message}`);
}

export async function deleteBrandMediaAsset(id: string): Promise<void> {
  if (id.startsWith("asset_partner_")) return;

  if (!isSupabaseConfigured()) {
    const state = await readJson();
    await writeJson({ assets: state.assets.filter((asset) => asset.id !== id) });
    return;
  }

  const { error } = await getSupabase().from("brand_media_assets").delete().eq("id", id);
  if (error) throw new Error(`Supabase ${error.code ?? "error"}: ${error.message}`);
}
