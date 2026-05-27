import { z } from "zod";

export const BrandMediaCategorySchema = z.enum([
  "kiosk",
  "partner_presentation",
  "location_mockup",
  "packaging",
  "brand_character",
  "map",
  "infographic",
  "operations",
  "social",
  "other",
]);

export const BrandMediaUsageSchema = z.enum([
  "partner_cover",
  "slide_visual",
  "deck_download",
  "location_card",
  "brand_overview",
  "menu_support",
  "map_background",
  "cta",
  "general",
]);

export const BrandMediaPartnerTypeSchema = z.enum([
  "mall",
  "club",
  "hypermarket",
  "cinema",
  "university",
  "petrol_station",
  "compound",
]);

export const BrandMediaAssetSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  url: z.string().min(1, "Asset URL is required"),
  thumbnailUrl: z.string().default(""),
  alt: z.string().min(1, "Alt text is required"),
  category: BrandMediaCategorySchema.default("other"),
  usage: BrandMediaUsageSchema.default("general"),
  partnerType: BrandMediaPartnerTypeSchema.optional().or(z.literal("")),
  slideId: z.string().default(""),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  createdAt: z.string().default(""),
  updatedAt: z.string().default(""),
});

export const BrandMediaStateSchema = z.object({
  assets: z.array(BrandMediaAssetSchema),
});

export type BrandMediaCategory = z.infer<typeof BrandMediaCategorySchema>;
export type BrandMediaUsage = z.infer<typeof BrandMediaUsageSchema>;
export type BrandMediaPartnerType = z.infer<typeof BrandMediaPartnerTypeSchema>;
export type BrandMediaAsset = z.infer<typeof BrandMediaAssetSchema>;
export type BrandMediaState = z.infer<typeof BrandMediaStateSchema>;

export const BRAND_MEDIA_CATEGORIES = BrandMediaCategorySchema.options;
export const BRAND_MEDIA_USAGES = BrandMediaUsageSchema.options;
export const BRAND_MEDIA_PARTNER_TYPES = BrandMediaPartnerTypeSchema.options;
