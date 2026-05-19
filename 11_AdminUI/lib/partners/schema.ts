import { z } from "zod";

export const PartnerSettingsSchema = z.object({
  /** Gate passcode for the /partners portal */
  passcode: z.string().default(""),
  /** Public UI hint — true when a passcode already exists server-side. */
  passcodeConfigured: z.boolean().default(false),
  /** Master toggle — is the portal accessible? */
  portalEnabled: z.boolean().default(false),
  /** Section toggles — what the partner sees */
  showPresentation: z.boolean().default(true),
  showLocations: z.boolean().default(true),
  showBrandOverview: z.boolean().default(true),
  showMenu: z.boolean().default(false),
  /** Featured branch IDs shown on the portal */
  featuredLocationIds: z.array(z.string()).default([]),
});

export type PartnerSettings = z.infer<typeof PartnerSettingsSchema>;
