"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { uploadFile } from "@/lib/upload";
import { requireAdminOrCreativeAction } from "@/lib/server-action-auth";
import {
  BrandMediaAssetSchema,
  type BrandMediaAsset,
} from "./schema";
import {
  deleteBrandMediaAsset,
  readBrandMedia,
  writeBrandMediaAsset,
} from "./store";

export async function getBrandMedia() {
  await requireAdminOrCreativeAction();
  return readBrandMedia();
}

export async function uploadBrandMediaFile(formData: FormData): Promise<string> {
  await requireAdminOrCreativeAction();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file uploaded");
  }

  return uploadFile(file, "brand-media", ["png", "jpg", "jpeg", "webp"], 15 * 1024 * 1024);
}

export async function saveBrandMediaAsset(
  input: BrandMediaAsset,
): Promise<{ data?: BrandMediaAsset; error?: string }> {
  try {
    await requireAdminOrCreativeAction();
    const timestamp = new Date().toISOString();
    const asset = BrandMediaAssetSchema.parse({
      ...input,
      id: input.id || `asset_${nanoid(10)}`,
      thumbnailUrl: input.thumbnailUrl || input.url,
      createdAt: input.createdAt || timestamp,
      updatedAt: timestamp,
    });

    await writeBrandMediaAsset(asset);
    revalidatePath("/partners");
    revalidatePath("/partner-portal");
    return { data: asset };
  } catch (err) {
    console.error("[saveBrandMediaAsset]", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function removeBrandMediaAsset(id: string): Promise<{ error?: string }> {
  try {
    await requireAdminOrCreativeAction();
    await deleteBrandMediaAsset(id);
    revalidatePath("/partners");
    revalidatePath("/partner-portal");
    return {};
  } catch (err) {
    console.error("[removeBrandMediaAsset]", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
