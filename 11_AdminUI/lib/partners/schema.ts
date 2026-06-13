import { z } from "zod";

export const PartnerPortalSlideSchema = z.object({
  id: z.string(),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  body: z.string().default(""),
  visual: z.string().default(""),
});

export const DEFAULT_PARTNER_PORTAL_SLIDES = [
  {
    id: "cover",
    eyebrow: "Partner Opportunity",
    title: "Bring MaMa Zainab to Your Location",
    body: "A compact, high-visibility Egyptian comfort-food kiosk built for premium footfall destinations.",
    visual: "Kiosk hero + Alexandria rollout map",
  },
  {
    id: "brand",
    eyebrow: "Brand Promise",
    title: "The Village Way, or Not at All",
    body: "Authentic Mahshi and oriental home-food, served with homemade warmth and fast-food speed.",
    visual: "Logo, palette, MaMa Zainab character, pattern system",
  },
  {
    id: "format",
    eyebrow: "Kiosk Format",
    title: "Small Footprint. Big Brand Presence.",
    body: "A modular kiosk format designed for food courts, entrances, club zones, cinema lobbies, and retail corridors.",
    visual: "3m x 2m x 2.5m kiosk diagram",
  },
  {
    id: "benefits",
    eyebrow: "Location Owner Benefits",
    title: "A Ready-Made Food Attraction",
    body: "Adds a strong local food category, activates unused space, increases dwell time, and creates a photo-friendly tenant.",
    visual: "Partner benefit cards",
  },
  {
    id: "rollout",
    eyebrow: "Expansion Plan",
    title: "Alexandria First. Egypt Next.",
    body: "The rollout starts with dense Alexandria coverage, then expands into clubs, malls, campuses, hypermarkets, and compounds.",
    visual: "Interactive location map",
  },
  {
    id: "cta",
    eyebrow: "Next Step",
    title: "Start the Partnership Conversation",
    body: "Download the current partner presentation, request a tasting session, or submit your location for assessment.",
    visual: "Partner deck and next actions",
  },
] satisfies z.infer<typeof PartnerPortalSlideSchema>[];

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
    .default("/partner-portal/deck"),
  presentationVersion: z.string().default("v0.1"),
  presentationUpdatedAt: z.string().default(""),
  brandVideoUrl: z.string().default(""),
  brandVideoTitle: z.string().default("Brand Video"),
  brandVideoBody: z
    .string()
    .default("Watch the MaMa Zainab brand story and partnership experience before reviewing the deck."),
  brandOverviewTitle: z.string().default("Fast-food Mahshi & oriental home-food"),
  brandOverviewBody: z
    .string()
    .default("MaMa Zainab is village authenticity at scale: warm, nostalgic, premium-casual Egyptian comfort food founded in Alexandria."),
  portalBenefitsTitle: z.string().default("Why the kiosk earns its space"),
  portalBenefitsEyebrow: z.string().default("Property Partner Benefits"),
  portalCommercialTitle: z.string().default("Flexible model paths"),
  portalCommercialEyebrow: z.string().default("Commercial Models"),
  portalLocationsTitle: z.string().default("Partner-ready rollout points"),
  portalLocationsEyebrow: z.string().default("Featured Locations"),
  portalSlides: z.array(PartnerPortalSlideSchema).default(DEFAULT_PARTNER_PORTAL_SLIDES),
  contactEmail: z.string().default("hello@mamazainab.com"),
  contactPhone: z.string().default(""),
  bookingUrl: z.string().default(""),
  assessmentUrl: z.string().default(""),
});

export type PartnerSettings = z.infer<typeof PartnerSettingsSchema>;
export type PartnerPortalSlide = z.infer<typeof PartnerPortalSlideSchema>;
