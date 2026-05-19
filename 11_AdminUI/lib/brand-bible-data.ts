/**
 * Complete Brand Bible data for the Brand Bible admin page.
 * Source of truth: 01_Brand/brand-bible.json
 *
 * Exports typed constants for every brand element:
 * identity, colors, typography, pattern, packaging, characters, scenes, rules.
 */



export const BRAND_IDENTITY = {
  name: "MaMa Zainab",
  nameArabic: "ماما زينب",
  tagline: "The Village Way, or Not at All",
  originStory:
    "Named after the archetype from the legendary Egyptian play 'El Eyal Kebret' — in the Egyptian subconscious, if Mama Zainab cooked it, it is undeniably delicious.",
  personality: ["authentic", "warm", "village-rooted", "nostalgic", "premium-casual"] as string[],
  marketPosition:
    "Fast-food Mahshi & Oriental home-food — village authenticity at scale",
  foundingCity: "Alexandria, Egypt",
} as const;



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
    role: "Primary — fresh grape leaves, village fields, core Mahshi product",
    usage: ["logo", "apron", "packaging_accent", "kiosk_header", "plaid_pattern"],
    category: "primary",
    locked: true,
  },
  {
    id: "brand_yellow",
    name: "Brand Yellow",
    hex: "#EFD200",
    rgb: [239, 210, 0],
    role: "Secondary warmth — golden rice, sunlight, Egyptian heritage",
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
    role: "Accent & alert — spice, tomato sauce, energy",
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
    role: "Background warmth — dough, village walls, comfort",
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
    sampleText: "Homemade taste. Fast-food style — for the first time.",
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
    sampleText: "ماما زينب — طعم بيتي بأسلوب الفاست فود",
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
    "Green-on-cream diamond weave — the signature textile pattern across all brand touchpoints",
  structure:
    "Diamond/argyle weave with primary green lines on cream base, yellow cross-threads",
  colors: ["#1B9B00", "#FFF8E7", "#EFD200"] as string[],
  lineWeight: "medium (3–5 px at 300 dpi)",
  diamondSize: "~40 px repeat tile",
  promptAnchor:
    "plaid pattern: green-on-cream diamond weave with thin yellow cross-threads, rustic textile feel, not tartan — softer, village-handwoven aesthetic",
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
 * Brand Icon Pattern — the repeating checkerboard surface pattern
 * made of brand-icon tiles (White Goose, mahshi rolls, plaid diamond, plate circle, cutlery).
 */
export const BRAND_ICON_PATTERN = {
  id: "brand_icon_pattern",
  name: "Brand Icon Pattern",
  description:
    "A repeating checkerboard surface pattern built from five brand icons — the White Goose, Mahshi Rolls, Diamond Plaid, Plate Circle, and Cutlery — arranged on alternating Mahshi Green, Saffron Yellow, and cream squares.",
  icons: [
    { id: "White Goose",    label: "White Goose",          desc: "Brand mascot — grace, heritage, Egyptian waterway" },
    { id: "mahshi",  label: "Mahshi Rolls",  desc: "Signature dish — stuffed grape-leaf rolls, the brand hero" },
    { id: "diamond", label: "Diamond Plaid", desc: "Plaid v2 motif — links the icon pattern to the textile plaid" },
    { id: "plate",   label: "Plate Circle",  desc: "Hospitality mark — cutlery inside a circle" },
    { id: "cutlery", label: "Cutlery",       desc: "Spoon + fork — food service identity" },
  ],
  colors: ["#1B9B00", "#EFD200", "#FFFFFF"] as string[],
  imagePath: "/brand/pattern/patern-graphy.jpeg",
  tileable: true,
  promptAnchor:
    "repeating icon checkerboard pattern: alternating green #1B9B00 and yellow #EFD200 squares on white, each square contains one silhouette icon — a White Goose, stuffed grape-leaf rolls, a diamond argyle motif, a plate with cutlery circle, or a fork-and-spoon set — clean flat vector style, brand colors only, no gradients",
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

export const CHARACTERS: BrandCharacter[] = [
  {
    id: "char_mama_zainab",
    name: "Mama Zainab",
    nameArabic: "ماما زينب",
    role: "Protagonist / Brand Face",
    descriptionShort:
      "The heart of the brand — an authentic Egyptian Falaha who won Wong's competition",
    visualPromptAnchor:
      "Egyptian Falaha village woman, late 50s-60s, warm kind round face, olive-brown skin, cream hijab village-wrapped, signature green-and-yellow plaid diamond-weave apron over dark green dress, flour-dusted strong hands, no makeup, motherly authority",
    avatarSrc: "/brand/chars/mama-zainab.jpeg",
    physicalTraits: {
      "Age range": "55–65",
      Build: "Medium, sturdy — a working woman",
      Skin: "Olive-brown, sun-touched, Egyptian",
      Face: "Round cheeks, deep smile lines, kind dark brown eyes",
      "Hair covering": "Cream/beige hijab, village (Falaha) style",
      Hands: "Strong, flour-dusted, thousands of grape leaves rolled",
    },
    wardrobe: [
      {
        label: "Plaid Apron (signature)",
        desc: "Green #1B9B00 on cream #FFF8E7, yellow #EFD200 cross-threads, diamond weave",
        colors: "#1B9B00 / #FFF8E7 / #EFD200",
      },
      {
        label: "Under-dress",
        desc: "Simple, modest — dark green, cream, or earth-tone galabiya",
      },
      {
        label: "Headscarf",
        desc: "Cream or beige, village-wrapped, slightly loose",
      },
    ],
    personality: ["warm", "stubborn-about-quality", "village-proud", "no-nonsense", "motherly"],
    signatureLine: "In this kitchen, we do it the village way, or not at all.",
    doNots: [
      "Make her look modern or urban",
      "Use fashion-forward hijab styling",
      "Show her without the plaid apron in brand contexts",
      "Make her skinny or model-like",
      "Give her Western features",
      "Show heavy makeup",
    ],
  },
  {
    id: "char_wong",
    name: "Shang Hong Wong",
    role: "Founder / Investor / 'The Banker'",
    descriptionShort:
      "The mysterious Chinese warrior-turned-food-empire-investor",
    visualPromptAnchor:
      "Chinese man, early-to-mid 60s, battle-scarred but dignified, lean athletic build, sharp intelligent eyes, short grey-white hair",
    avatarSrc: "/brand/chars/wong-hong.png",
    physicalTraits: {
      "Age range": "60–65",
      Ethnicity: "Chinese",
      Build: "Lean, athletic — a retired fighter",
      Face: "Sharp features, battle scars (subtle), piercing eyes, grey-white hair",
      Expression: "Calm authority, dangerous calm, the rare small smile",
    },
    wardrobe: [
      {
        label: "Warrior Mode",
        desc: "Dark silken Chinese warrior robes — traditional, flowing",
        colors: "Black, charcoal, deep midnight",
        context: "Flashbacks, Scene 1 (rooftop), Scene 2 (pyramids)",
      },
      {
        label: "Business Mode",
        desc: "Premium minimalist linen suit",
        colors: "Cream, light grey, natural linen",
        context: "Scene 3 onwards — the investor persona",
      },
      {
        label: "Silhouette Mode",
        desc: "Dark silhouette against bright windows",
        context: "Scene 6 — the mysterious 'Banker' on the phone",
      },
    ],
    personality: ["tactical", "mysterious", "respectful", "warrior-philosopher", "silent-power"],
    signatureLine: "The war is finally over.",
    doNots: [
      "Make him look comedic or cartoonish",
      "Show him cooking — he judges, he does not cook",
      "Remove the battle-worn gravitas",
      "Make him look young or pretty-boy",
      "Show him in casual/sloppy clothing",
    ],
  },
  {
    id: "char_zuzu",
    name: "ZuZu the Goose",
    nameArabic: "زوزو",
    role: "Mascot / Sidekick",
    descriptionShort:
      "Mama Zainab's loyal white goose mascot — comedic, protective, brand icon",
    visualPromptAnchor:
      "Pure white domestic goose, plump and proud, wearing a small plaid ribbon, expressive orange beak, bright eyes, slightly mischievous posture",
    avatarSrc: "/brand/chars/zuzu-thumb.png",
    physicalTraits: {
      Species: "White domestic goose (Embden-type)",
      Color: "Pure white feathers",
      Beak: "Orange",
      Feet: "Orange webbed",
      Size: "Medium-large goose, plump",
      Accessory: "Small plaid ribbon matching apron pattern",
    },
    wardrobe: [
      {
        label: "Plaid Ribbon",
        desc: "Small green-cream-yellow diamond weave ribbon — around neck or as a tiny bow",
        colors: "#1B9B00 / #FFF8E7 / #EFD200",
      },
    ],
    personality: ["mischievous", "protective", "comedic", "loyal", "scene-stealer"],
    signatureLine: undefined,
    doNots: [
      "Make it a duck or White Goose",
      "Make it look aggressive or scary",
      "Forget the plaid ribbon",
      "Make it too small — it's a full-size goose",
    ],
  },
  {
    id: "char_ghost",
    name: "Ghost of Mama Zainab",
    nameArabic: "روح ماما زينب",
    role: "Supernatural Guide (video only)",
    descriptionShort:
      "An ethereal, younger version of Mama Zainab — visible only to her and ZuZu",
    visualPromptAnchor:
      "Ethereal translucent figure of a younger Egyptian woman (30s), same facial features as Mama Zainab but younger and glowing, semi-transparent with soft greenish-golden luminescence, flowing white galabiya, serene knowing expression",
    avatarSrc: "/brand/chars/mama-zainab.jpeg",
    physicalTraits: {
      "Age appearance": "30s (younger Mama Zainab)",
      Transparency: "Semi-transparent, ethereal glow",
      "Glow color": "#1B9B00 + #EFD200 blended (green-gold)",
      Dress: "Flowing white galabiya",
    },
    wardrobe: [
      {
        label: "Galabiya",
        desc: "Flowing white galabiya — simple, otherworldly",
      },
    ],
    personality: ["serene", "knowing", "protective", "mystical"],
    signatureLine: undefined,
    doNots: [
      "Make her look scary or horror-ghost",
      "Show her as a completely different person from Mama Zainab",
      "Make the glow blue or purple — it must be brand green-gold",
    ],
  },
];



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
    "Plaid pattern always present as accent band or wrap — never full-cover",
    "Logo placement: top-center or lid-center",
    "Green #1B9B00 is the dominant packaging color",
    "No gradients — flat brand colors only",
    "ZuZu mascot may appear as a small stamp/icon",
  ] as string[],
  items: [
    { id: "food_box", name: "Food Box", description: "Main takeaway box — cream base with green plaid band wrapping, logo on lid" },
    { id: "can_holder", name: "Can Holder", description: "Beverage can holder/sleeve — plaid pattern wrap with logo stamp" },
    { id: "takeaway_column", name: "Takeaway Column", description: "Vertical takeaway pillar — tall branded container for stacked mahshi portions" },
    { id: "sauce_station", name: "Sauce Station", description: "Kiosk sauce dispensing area — branded panel with sauce labels" },
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

export const SCENES: SceneMapping[] = [
  {
    id: "scene_1",
    label: "Scene 1 — Neon Rooftop",
    characters: ["Shang Hong Wong"],
    wongMode: "warrior",
    paletteFocus: ["Ink #2C292A", "Brand Red #E60000"],
    patternUsage: "none",
    mood: "dark, neon, rain, high-action",
    brandElements: ["glass-morphic phone"],
  },
  {
    id: "scene_2",
    label: "Scene 2 — Pyramids",
    characters: ["Shang Hong Wong"],
    wongMode: "warrior",
    paletteFocus: ["Cream #FFF8E7", "Mahshi Green #1B9B00", "Brand Yellow #EFD200"],
    patternUsage: "none",
    mood: "epic, golden, vast, meditative",
    brandElements: ["glass-morphic phone", "pyramid location"],
  },
  {
    id: "scene_3",
    label: "Scene 3 — Competition",
    characters: ["Shang Hong Wong", "Mama Zainab"],
    wongMode: "business",
    paletteFocus: ["Mahshi Green #1B9B00", "Brand Yellow #EFD200", "Cream #FFF8E7"],
    patternUsage: "aprons, stage banners",
    mood: "bright, Mediterranean, festive, competitive",
    brandElements: ["golden bell", "judging table", "stoves"],
  },
  {
    id: "scene_4",
    label: "Scene 4 — Cooking",
    characters: ["Mama Zainab", "ZuZu", "Ghost"],
    paletteFocus: ["Mahshi Green #1B9B00", "Brand Yellow #EFD200", "Cream #FFF8E7"],
    patternUsage: "apron, zuzu ribbon",
    mood: "comedic, chaotic, warm",
    brandElements: ["plaid apron", "plaid ribbon", "cooking station"],
  },
  {
    id: "scene_5",
    label: "Scene 5 — Judging",
    characters: ["Shang Hong Wong", "Mama Zainab"],
    wongMode: "business",
    paletteFocus: ["Mahshi Green #1B9B00", "Brand Yellow #EFD200"],
    patternUsage: "apron",
    mood: "dramatic, emotional, triumphant",
    brandElements: ["golden bell", "single mahshi finger", "flavor-explosion VFX"],
  },
  {
    id: "scene_6",
    label: "Scene 6 — Command Center",
    characters: ["Mama Zainab", "ZuZu", "Ghost", "Wong (silhouette)"],
    wongMode: "silhouette",
    paletteFocus: ["Garlic White #FAFAFA", "Mahshi Green #1B9B00", "Cream #FFF8E7"],
    patternUsage: "apron, subtle office accents",
    mood: "clean, futuristic, peaceful, Apple-store aesthetic",
    brandElements: ["holographic menus", "red phone", "harbor view", "brand packaging on shelves"],
  },
];



export const GENERATION_RULES = {
  mandatory: [
    "ALWAYS inject palette_block when 'Append brand palette' is enabled",
    "ALWAYS inject the correct character_anchor when a CHARACTER ANCHOR is selected",
    "ALWAYS inject plaid_block when character wears apron or packaging is shown",
    "NEVER generate Mama Zainab without the plaid apron in brand/marketing contexts",
    "NEVER generate Wong cooking — he is the investor, not the cook",
    "NEVER use blue, purple, or pink as dominant colors — they are off-brand",
    "ALWAYS match Wong's wardrobe mode to the scene context",
    "ZuZu must always have the plaid ribbon accessory",
  ],
  qualityGates: [
    { check: "Character consistency", rule: "Compare generated face against asset_refs — reject if features don't match reference" },
    { check: "Palette compliance", rule: "Dominant colors must be within brand palette — flag if >20% off-palette color" },
    { check: "Pattern accuracy", rule: "Plaid must be diamond weave, not tartan/gingham/checkered" },
    { check: "Hijab style", rule: "Must be village-wrapped, not modern fashion hijab" },
  ],
};



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
