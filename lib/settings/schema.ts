import { z } from "zod";

export const SettingsSchema = z.object({
  // Account
  userName: z.string().min(1, "Required").default("HITL Admin"),
  email: z.string().email("Invalid email").default("hello@mamazainab.com"),
  // Localization
  primaryLanguage: z.string().default("English"),
  secondaryLanguage: z.string().default("Arabic (Egyptian)"),
  currency: z.string().default("EGP"),
  timezone: z.string().default("Africa/Cairo"),
  // Notifications
  notifyMenuChanges: z.boolean().default(true),
  notifyVideoUpdates: z.boolean().default(true),
  notifyMaintenance: z.boolean().default(true),
  // Security
  sessionTimeout: z.string().default("30"),
});

export type Settings = z.infer<typeof SettingsSchema>;
