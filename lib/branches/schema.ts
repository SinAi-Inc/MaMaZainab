import { z } from "zod";

export const BranchStatusSchema = z.enum(["active", "construction", "paused", "closed"]);

export const BranchSchema = z.object({
  id: z.string(),
  kioskNumber: z.coerce.number().int().positive(),
  name: z.string().min(1, "Name is required"),
  city: z.string().default("Alexandria"),
  district: z.string().default(""),
  address: z.string().default(""),
  phone: z.string().default(""),
  manager: z.string().default(""),
  status: BranchStatusSchema.default("construction"),
  openHours: z.string().default("09:00–23:00"),
  seating: z.coerce.number().int().min(0).default(0),
  notes: z.string().default(""),
});

export const BranchesStateSchema = z.object({
  branches: z.array(BranchSchema),
});

export type Branch = z.infer<typeof BranchSchema>;
export type BranchStatus = z.infer<typeof BranchStatusSchema>;
export type BranchesState = z.infer<typeof BranchesStateSchema>;

export const STATUS_META: Record<BranchStatus, { label: string; tone: "success" | "warning" | "info" | "neutral" | "error" }> = {
  active:       { label: "Active",       tone: "success" },
  construction: { label: "Construction", tone: "warning" },
  paused:       { label: "Paused",       tone: "neutral" },
  closed:       { label: "Closed",       tone: "error" },
};
