/**
 * Complete Brand Bible data for the Brand Bible admin page.
 * Source of truth: 01_Brand/brand-bible.json
 *
 * Exports typed constants for every brand element:
 * identity, colors, typography, pattern, packaging, characters, scenes, rules.
 *
 * Sensitive prose (origin story, character anchors, scene moods, generation rules)
 * is loaded at runtime from the gitignored data/brand-private.json (local dev) or
 * the BRAND_PRIVATE_DATA environment variable (Vercel / production).
 */

import { loadBrandPrivate } from "@/lib/private-brand-loader";

const _p = loadBrandPrivate();

export const BRAND_IDENTITY = _p.brandIdentity;



export type ColorToken = {
  id: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
  role: string;
  usage: string[];
  category: "primary" | "secondary" | "extended";
  locked?: boolean;
};

export const COLORS: ColorToken[] = [
  // Primary
  {
    id: "mahshi_green",
    name: "Mahshi Green",
    hex: "#1B9B00",
    rgb: [27, 155, 0],
    role: "Primary - fresh grape leaves, village fields, core Mahshi product",
    usage: ["logo", "apron", "packaging_accent", "kiosk_header", "plaid_pattern"],
    category: "primary",
    locked: true,
  },
  {
    id: "brand_yellow",
    name: "Brand Yellow",
    hex: "#EFD200",
    rgb: [239, 210, 0],
    role: "Secondary warmth - golden rice, sunlight, Egyptian heritage",
    usage: ["apron_plaid_cross", "highlight_accents", "menu_headers", "zuzu_ribbon"],
    category: "primary",
    locked: true,
  },
  // Secondary
  {
    id: "brand_red",
    name: "Brand Red",
    hex: "#E60000",
    rgb: [230, 0, 0],
    role: "Accent & alert - spice, tomato sauce, energy",
    usage: ["sale_badges", "hot_items", "wong_accent", "emergency_phone"],
    category: "secondary",
  },
  {
    id: "ink",
    name: "Ink",
    hex: "#2C292A",
    rgb: [44, 41, 42],
    role: "Primary text & deep contrast",
    usage: ["body_text", "logo_outline", "wong_silhouette"],
    category: "secondary",
  },
  {
    id: "cream",
    name: "Cream",
    hex: "#FFF8E7",
    rgb: [255, 248, 231],
    role: "Background warmth - dough, village walls, comfort",
    usage: ["backgrounds", "packaging_base", "plaid_base", "menu_canvas"],
    category: "secondary",
  },
  // Extended
  {
    id: "green_deep",
    name: "Green Deep",
    hex: "#169216",
    rgb: [22, 146, 22],
    role: "Hover / dark green variant",
    usage: ["hover_states", "focus_rings"],
    category: "extended",
  },
  {
    id: "vine_dark",
    name: "Vine Dark",
    hex: "#0D5E00",
    rgb: [13, 94, 0],
    role: "Deep green for shadows, stuffed grape leaf interiors",
    usage: ["shadows", "dark_accents"],
    category: "extended",
  },
  {
    id: "lemon_zest",
    name: "Lemon Zest",
    hex: "#FFF44F",
    rgb: [255, 244, 79],
    role: "Highlight sparkle for food photography overlays",
    usage: ["photo_overlays", "highlights"],
    category: "extended",
  },
  {
    id: "garlic_white",
    name: "Garlic White",
    hex: "#FAFAFA",
    rgb: [250, 250, 250],
    role: "Clean UI surfaces, kiosk screens",
    usage: ["ui_surfaces", "kiosk_screens"],
    category: "extended",
  },
  {
    id: "alert_red",
    name: "Alert Red",
    hex: "#E60000",
    rgb: [230, 0, 0],
    role: "\"STOP\" disruption campaign only",
    usage: ["disruption_campaign"],
    category: "extended",
  },
  {
    id: "muted_grey",
    name: "Muted Grey",
    hex: "#B7B7B7",
    rgb: [183, 183, 183],
    role: "Dividers / disabled elements",
    usage: ["dividers", "disabled"],
    category: "extended",
  },
];



export type FontToken = {
  id: string;
  family: string;
  weights: string[];
  role: string;
  usage: string;
  fallback: string;
  cssVar?: string;
  sampleText?: string;
};

export const FONTS: FontToken[] = [
  {
    id: "display",
    family: "Chinese Monoline",
    weights: ["Regular"],
    role: "Display / Brand",
    usage: "Headlines, logo wordmark, section titles. Never body text.",
    fallback: "Impact, sans-serif",
    cssVar: "--font-brand",
    sampleText: "MaMa Zainab",
  },
  {
    id: "body",
    family: "Poppins",
    weights: ["Light", "Regular", "Medium", "SemiBold", "Bold"],
    role: "Body / UI",
    usage: "Body copy, menu descriptions, UI text, labels, pricing.",
    fallback: "Montserrat, sans-serif",
    cssVar: "--font-sans",
    sampleText: "Homemade taste. Fast-food style - for the first time.",
  },
  {
    id: "secondary",
    family: "Montserrat",
    weights: ["Light", "Regular", "Bold"],
    role: "Secondary Body",
    usage: "Subtitle text, secondary copy.",
    fallback: "Poppins, sans-serif",
  },
  {
    id: "arabic",
    family: "Cairo",
    weights: ["Regular", "Bold"],
    role: "Arabic",
    usage: "All Arabic text, RTL layouts, kiosk screens.",
    fallback: "Noto Sans Arabic, sans-serif",
    cssVar: "--font-arabic",
    sampleText: "ماما زينب - طعم بيتي بأسلوب الفاست فود",
  },
  {
    id: "script",
    family: "Lucida Handwriting",
    weights: ["Italic"],
    role: "Brand Script",
    usage: "Mama Zainab's personal quotes, handwritten feel accents.",
    fallback: "cursive",
  },
  {
    id: "cultural_cn",
    family: "Chinese Monoline",
    weights: ["Regular"],
    role: "Cultural Accent (Chinese)",
    usage: "Wong's dialogue cards, East-meets-Egypt fusion elements.",
    fallback: "serif",
  },
];



export type PatternVariant = {
  name: string;
  cellSize: string;
  tilePng: string;
  swatchPng: string;
  usage: string;
};

export const PATTERN = {
  id: "plaid_v2",
  name: "Mama Zainab Plaid",
  description:
    "Green-on-cream diamond weave - the signature textile pattern across all brand touchpoints",
  structure:
    "Diamond/argyle weave with primary green lines on cream base, yellow cross-threads",
  colors: ["#1B9B00", "#FFF8E7", "#EFD200"] as string[],
  lineWeight: "medium (3–5 px at 300 dpi)",
  diamondSize: "~40 px repeat tile",
  promptAnchor: _p.patternPromptAnchor,
  doNots: [
    "Use Scottish tartan",
    "Use checkered gingham",
    "Make lines too thick or neon",
  ],
  usage: [
    "Apron fabric",
    "Packaging wraps",
    "Napkins",
    "Kiosk trim",
    "Social borders",
    "Video lower-thirds",
  ],
  variants: [
    {
      name: "Web",
      cellSize: "32 px",
      tilePng: "/brand/plaid/tile_gingham_web.png",
      swatchPng: "/brand/plaid/swatch_web.png",
      usage: "Website heroes, app backgrounds, digital banners",
    },
    {
      name: "Packaging",
      cellSize: "48 px",
      tilePng: "/brand/plaid/tile_gingham_packaging.png",
      swatchPng: "/brand/plaid/swatch_packaging.png",
      usage: "Boxes, bags, wrapping paper, side panels",
    },
    {
      name: "Apron",
      cellSize: "64 px",
      tilePng: "/brand/plaid/tile_gingham_apron.png",
      swatchPng: "/brand/plaid/swatch_apron.png",
      usage: "Staff aprons, tablecloths, napkins, merch",
    },
  ] as PatternVariant[],
};

/**
 * Brand Icon Pattern - the repeating checkerboard surface pattern
 * made of brand-icon tiles (White Goose, mahshi rolls, plaid diamond, plate circle, cutlery).
 */
export const BRAND_ICON_PATTERN = {
  id: "brand_icon_pattern",
  name: "Brand Icon Pattern",
  description:
    "A repeating checkerboard surface pattern built from five brand icons - the White Goose, Mahshi Rolls, Diamond Plaid, Plate Circle, and Cutlery - arranged on alternating Mahshi Green, Saffron Yellow, and cream squares.",
  icons: [
    { id: "White Goose",    label: "White Goose",          desc: "Brand mascot - grace, heritage, Egyptian waterway" },
    { id: "mahshi",  label: "Mahshi Rolls",  desc: "Signature dish - stuffed grape-leaf rolls, the brand hero" },
    { id: "diamond", label: "Diamond Plaid", desc: "Plaid v2 motif - links the icon pattern to the textile plaid" },
    { id: "plate",   label: "Plate Circle",  desc: "Hospitality mark - cutlery inside a circle" },
    { id: "cutlery", label: "Cutlery",       desc: "Spoon + fork - food service identity" },
  ],
  colors: ["#1B9B00", "#EFD200", "#FFFFFF"] as string[],
  imagePath: "/brand/pattern/patern-graphy.jpeg",
  tileable: true,
  promptAnchor: _p.iconPatternPromptAnchor,
  doNots: [
    "Mix in non-brand icons",
    "Use photographic textures inside the squares",
    "Rotate individual tiles",
    "Use on white-only backgrounds without contrast (pattern must remain legible)",
  ],
  usage: [
    "Packaging wraps (full-cover or band)",
    "Social media backgrounds",
    "Website hero sections",
    "Video lower-thirds & transitions",
    "Kiosk interior walls",
    "Merchandise (tote bags, cups, boxes)",
    "AI-generated scene backgrounds",
  ],
};



export type BrandCharacter = {
  id: string;
  name: string;
  nameArabic?: string;
  role: string;
  descriptionShort: string;
  visualPromptAnchor: string;
  avatarSrc: string;
  physicalTraits: Record<string, string>;
  wardrobe: { label: string; desc: string; colors?: string; context?: string }[];
  personality: string[];
  signatureLine?: string;
  doNots: string[];
};

export const CHARACTERS: BrandCharacter[] = _p.characters as BrandCharacter[];



export type PackagingItem = {
  id: string;
  name: string;
  description: string;
  assetRef?: string;
};

export const PACKAGING = {
  note: "All packaging uses cream #FFF8E7 as base, plaid v2 pattern accents, mahshi green #1B9B00 dominant",
  rules: [
    "Cream base, never pure white",
    "Plaid pattern always present as accent band or wrap - never full-cover",
    "Logo placement: top-center or lid-center",
    "Green #1B9B00 is the dominant packaging color",
    "No gradients - flat brand colors only",
    "ZuZu mascot may appear as a small stamp/icon",
  ] as string[],
  items: [
    { id: "food_box", name: "Food Box", description: "Main takeaway box - cream base with green plaid band wrapping, logo on lid" },
    { id: "can_holder", name: "Can Holder", description: "Beverage can holder/sleeve - plaid pattern wrap with logo stamp" },
    { id: "takeaway_column", name: "Takeaway Column", description: "Vertical takeaway pillar - tall branded container for stacked mahshi portions" },
    { id: "sauce_station", name: "Sauce Station", description: "Kiosk sauce dispensing area - branded panel with sauce labels" },
  ] as PackagingItem[],
};



export type SceneMapping = {
  id: string;
  label: string;
  characters: string[];
  wongMode?: string;
  paletteFocus: string[];
  patternUsage: string;
  mood: string;
  brandElements: string[];
};

export const SCENES: SceneMapping[] = _p.scenes as SceneMapping[];



export const GENERATION_RULES = _p.generationRules;



export const LOGO_ASSETS = {
  wordmark: {
    lock: "TEXT_AND_FONT_ONLY",
    approvedSpelling: "MaMa Zainab",
    rejected: ["MAMA ZAYNAB", "MAMA ZEINAB", "Mama Zeinab", "Mamma", "Mamazainab"],
    minSizeWeb: "120 px",
    minSizePrint: "25 mm",
    clearSpace: "1× cap-height of 'M' on all sides",
  },
  variants: [
    { src: "/brand/logo-primary.png", label: "Primary (on light)", bg: "bg-brand-cream" },
    { src: "/brand/logo-on-dark.png", label: "On dark", bg: "bg-brand-ink" },
    { src: "/brand/logo-wordmark-transparent.png", label: "Wordmark (transparent)", bg: "bg-brand-green" },
    { src: "/brand/logo-mono.png", label: "Mono", bg: "bg-zinc-100" },
  ],
  marks: [
    { src: "/brand/mark.png", label: "Default", bg: "bg-white" },
    { src: "/brand/mark-transparent.png", label: "Transparent", bg: "bg-brand-green" },
    { src: "/brand/mark-avatar.png", label: "Avatar (circle)", bg: "bg-brand-cream" },
  ],
};
