import { z } from "zod";

export const InventoryCategorySchema = z.enum([
  "raw",
  "prepared",
  "packaging",
  "cleaning",
  "retail",
  "other",
]);

export const InventoryMovementTypeSchema = z.enum([
  "receive",
  "use",
  "waste",
  "count",
  "adjust",
  "transfer",
]);

export const InventoryItemSchema = z.object({
  id: z.string(),
  sku: z.string().default(""),
  name: z.string().min(1, "Name is required"),
  category: InventoryCategorySchema.default("raw"),
  unit: z.string().min(1, "Unit is required"),
  onHand: z.coerce.number().default(0),
  parLevel: z.coerce.number().min(0).default(0),
  reorderPoint: z.coerce.number().min(0).default(0),
  unitCostEgp: z.coerce.number().min(0).default(0),
  supplier: z.string().default(""),
  storageLocation: z.string().default(""),
  linkedMenuItemId: z.string().default(""),
  notes: z.string().default(""),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const InventoryMovementSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  type: InventoryMovementTypeSchema,
  quantity: z.coerce.number().min(0),
  delta: z.coerce.number(),
  beforeQty: z.coerce.number(),
  afterQty: z.coerce.number(),
  unitCostEgp: z.coerce.number().min(0).default(0),
  note: z.string().default(""),
  createdAt: z.string(),
  createdBy: z.string().default("admin"),
});

export const InventoryStateSchema = z.object({
  version: z.number().int().default(1),
  items: z.array(InventoryItemSchema).default([]),
  movements: z.array(InventoryMovementSchema).default([]),
});

export const InventoryItemInputSchema = z.object({
  sku: z.string().default(""),
  name: z.string().min(1, "Name is required"),
  category: InventoryCategorySchema.default("raw"),
  unit: z.string().min(1, "Unit is required"),
  onHand: z.coerce.number().default(0),
  parLevel: z.coerce.number().min(0).default(0),
  reorderPoint: z.coerce.number().min(0).default(0),
  unitCostEgp: z.coerce.number().min(0).default(0),
  supplier: z.string().default(""),
  storageLocation: z.string().default(""),
  linkedMenuItemId: z.string().default(""),
  notes: z.string().default(""),
  isActive: z.boolean().default(true),
});

export const InventoryAdjustmentInputSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  type: InventoryMovementTypeSchema,
  quantity: z.coerce.number().min(0, "Quantity must be zero or greater"),
  note: z.string().default(""),
}).superRefine((data, ctx) => {
  if (data.type !== "count" && data.quantity <= 0) {
    ctx.addIssue({
      code: "custom",
      path: ["quantity"],
      message: "Quantity must be greater than zero",
    });
  }
});

export type InventoryCategory = z.infer<typeof InventoryCategorySchema>;
export type InventoryMovementType = z.infer<typeof InventoryMovementTypeSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;
export type InventoryState = z.infer<typeof InventoryStateSchema>;
export type InventoryItemInput = z.output<typeof InventoryItemInputSchema>;
export type InventoryAdjustmentInput = z.output<typeof InventoryAdjustmentInputSchema>;

export const INVENTORY_CATEGORY_META: Record<InventoryCategory, { label: string }> = {
  raw: { label: "Raw Ingredients" },
  prepared: { label: "Prepared Batches" },
  packaging: { label: "Packaging" },
  cleaning: { label: "Cleaning" },
  retail: { label: "Retail" },
  other: { label: "Other" },
};

export const INVENTORY_MOVEMENT_META: Record<InventoryMovementType, { label: string; sign: "in" | "out" | "set" }> = {
  receive: { label: "Receive", sign: "in" },
  use: { label: "Use", sign: "out" },
  waste: { label: "Waste", sign: "out" },
  count: { label: "Count", sign: "set" },
  adjust: { label: "Adjust", sign: "in" },
  transfer: { label: "Transfer Out", sign: "out" },
};
