import { z } from "zod";

export const PartnerSettingsSchema = z.object({
  /** Gate passcode for the /partners portal */
  passcode: z.string().default(""),
  /** Public UI hint - true when a passcode already exists server-side. */
  passcodeConfigured: z.boolean().default(false),
  /** Master toggle - is the portal accessible? */
  portalEnabled: z.boolean().default(false),
  /** Section toggles - what the partner sees */
  showPresentation: z.boolean().default(true),
  showLocations: z.boolean().default(true),
  showBrandOverview: z.boolean().default(true),
  showMenu: z.boolean().default(false),
  /** Featured branch IDs shown on the portal */
  featuredLocationIds: z.array(z.string()).default([]),
  presentationTitle: z.string().default("MaMa Zainab Partner Presentation"),
  presentationSubtitle: z
    .string()
    .default("Authentic Mahshi. Homemade Taste. Fast-Food Speed."),
  presentationFileUrl: z
    .string()
    .default("/Mama-Zainab-Partners-Presentation.pdf"),
  presentationVersion: z.string().default("v0.1"),
  presentationUpdatedAt: z.string().default(""),
  contactEmail: z.string().default("hello@mamazainab.com"),
  contactPhone: z.string().default(""),
  bookingUrl: z.string().default(""),
  assessmentUrl: z.string().default(""),
});

export type PartnerSettings = z.infer<typeof PartnerSettingsSchema>;
