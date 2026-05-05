import { z } from "zod";

/* -------------------------------------------------------------- */
/*  Menu domain - bilingual (EN/AR), prices in EGP                */
/* -------------------------------------------------------------- */

export const BadgeSchema = z.enum([
  "new",
  "spicy",
  "vegan",
  "bestseller",
  "chefs_pick",
  "limited",
]);
export type Badge = z.infer<typeof BadgeSchema>;

export const BADGE_META: Record<Badge, { label: string; emoji: string }> = {
  new:        { label: "New",         emoji: "✨" },
  spicy:      { label: "Spicy",       emoji: "🌶️" },
  vegan:      { label: "Vegan",       emoji: "🌱" },
  bestseller: { label: "Bestseller",  emoji: "⭐" },
  chefs_pick: { label: "Chef's Pick", emoji: "👨‍🍳" },
  limited:    { label: "Limited",     emoji: "⏳" },
};

export const MenuItemSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  sku: z.string().default(""),
  nameEn: z.string().min(1, "Required"),
  descriptionEn: z.string().default(""),
  priceEgp: z.coerce.number().min(0, "Must be ≥ 0"),
  imageUrl: z.string().default(""),
  badges: z.array(BadgeSchema).default([]),
  available: z.boolean().default(true),
  sort: z.coerce.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const MenuCategorySchema = z.object({
  id: z.string(),
  nameEn: z.string().min(1, "Required"),
  descriptionEn: z.string().default(""),
  sort: z.coerce.number().int().default(0),
  visible: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MenuCategory = z.infer<typeof MenuCategorySchema>;

export const MenuStateSchema = z.object({
  version: z.number().int().default(1),
  categories: z.array(MenuCategorySchema).default([]),
  items: z.array(MenuItemSchema).default([]),
});
export type MenuState = z.infer<typeof MenuStateSchema>;

/* Form input schemas (without server-managed fields) */
export const CategoryInputSchema = z.object({
  nameEn: z.string().min(1, "Required"),
  descriptionEn: z.string(),
  sort: z.coerce.number().int(),
  visible: z.boolean(),
});
export type CategoryInput = z.output<typeof CategoryInputSchema>;
export type CategoryInputRaw = z.input<typeof CategoryInputSchema>;

export const ItemInputSchema = z.object({
  categoryId: z.string().min(1, "Required"),
  nameEn: z.string().min(1, "Required"),
  descriptionEn: z.string(),
  priceEgp: z.coerce.number().min(0, "Must be ≥ 0"),
  imageUrl: z.string(),
  badges: z.array(BadgeSchema),
  available: z.boolean(),
  sort: z.coerce.number().int(),
});
export type ItemInput = z.output<typeof ItemInputSchema>;
export type ItemInputRaw = z.input<typeof ItemInputSchema>;
