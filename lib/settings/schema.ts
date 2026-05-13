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
  // API Management
  orderingApiUrl: z.string().default(""),
  orderingApiEnabled: z.boolean().default(false),
  posApiUrl: z.string().default(""),
  posApiEnabled: z.boolean().default(false),
  deliveryApiUrl: z.string().default(""),
  deliveryApiEnabled: z.boolean().default(false),
  // Social Media
  socialFacebook: z.string().default(""),
  socialInstagram: z.string().default(""),
  socialTiktok: z.string().default(""),
  socialTwitter: z.string().default(""),
  socialYoutube: z.string().default(""),
  socialWhatsapp: z.string().default(""),
  // Security
  sessionTimeout: z.string().default("30"),
  requirePassword: z.boolean().default(false),
  adminPassword: z.string().default(""),
  allowPublicMenu: z.boolean().default(true),
  /** ISO timestamp — JWTs issued before this are rejected ("end all sessions"). */
  sessionFloor: z.string().default(""),
});

export type Settings = z.infer<typeof SettingsSchema>;
