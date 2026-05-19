/**
 * Rebuild shots from the NEW screenplay (04_Scripts/MaMa Zainab.md).
 *
 * This script:
 *  1. Parses each scene's visual direction from the screenplay
 *  2. Generates cinematic shot prompts designed for LoRA-conditioned Flux
 *  3. Replaces the shot prompts (and optionally the full scene/shot structure)
 *     in data/videos.json
 *
 * The prompts use trigger words for trained character LoRAs:
 *   - <lora:mama_zainab>  → MaMa Zainab
 *   - <lora:wong_warrior> → Wong in warrior robes
 *   - <lora:wong_banker>  → Wong in linen suit
 *   - <lora:zuzu>         → ZuZu the goose
 *
 * Usage: npx tsx _tools/rebuild_shots_from_script.mts [--dry-run]
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const DRY_RUN = process.argv.includes("--dry-run");
const VIDEOS_PATH = path.join(import.meta.dirname, "../data/videos.json");
const PROJECT_ID = "prj_brand_incorporation";

/* ---- Character Trigger + Anchor combos ---- */

const CHAR_MAMA_ZAINAB = `<lora:mama_zainab> Egyptian woman in her late 50s, warm kind face, soft dark eyes, gentle smile lines, olive skin, cream headscarf, GREEN-base plaid apron with yellow stripes, gold hoop earrings, flour-dusted hands`;

const CHAR_WONG_WARRIOR = `<lora:wong_warrior> East-Asian man in his 60s, salt-and-pepper hair tied back, weathered face with subtle scars, calm dangerous eyes, dark silken warrior robes, coiled dangerous stillness`;

const CHAR_WONG_BANKER = `<lora:wong_banker> East-Asian man in his 60s, salt-and-pepper hair tied back, weathered face with subtle scars, calm warm eyes, crisp cream linen suit, dignified founder presence`;

const CHAR_ZUZU = `<lora:zuzu> plump white domestic goose, fluffy clean feathers, expressive amber eyes, vivid orange beak and feet, tiny GREEN-base plaid ribbon around neck`;

/* ---- Global style suffix for cinematic consistency ---- */

const STYLE_SUFFIX = `cinematic photorealistic, shallow depth of field, volumetric haze, warm Mediterranean highlights with cool teal shadows, 16:9 aspect ratio`;

/* ---- Scene definitions from the NEW script ---- */

interface ShotDef {
  number: string;
  type: "establishing" | "action" | "closeup" | "montage" | "dialogue" | "insert" | "vfx";
  durationSec: number;
  description: string;
  prompt: string;
  dialogue: string;
  cameraNotes: string;
}

interface SceneDef {
  number: number;
  title: string;
  location: string;
  mood: string;
  shots: ShotDef[];
}

const SCENES: SceneDef[] = [
  {
    number: 1,
    title: "The Warrior Who Wanted Food",
    location: "Neon City Rooftop · Shanghai · Night",
    mood: "Tense, electric, rain-soaked action",
    shots: [
      {
        number: "1.1",
        type: "establishing",
        durationSec: 6,
        description: "Slow-motion rain catches neon signs. Shanghai rooftop at night.",
        prompt: `Cinematic establishing shot, neon-lit Shanghai rooftop at night, torrential rain catching pink cyan and magenta neon glow, wet concrete surface reflecting city lights, dense skyscraper backdrop, rain streaks in slow motion, moody atmosphere, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Slow push-in from wide, rain in slo-mo",
      },
      {
        number: "1.2",
        type: "action",
        durationSec: 6,
        description: "Wong sprints across rooftop, stops at ledge. Mob behind him.",
        prompt: `${CHAR_WONG_WARRIOR}, sprinting across a rain-soaked rooftop at night, skidding to a stop at the ledge, back three-quarters to camera, neon city abyss beyond, rain slashing diagonally, high tension, urgent motion, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Tracking shot following Wong, stops with him at ledge",
      },
      {
        number: "1.3",
        type: "action",
        durationSec: 4,
        description: "Mob bursts through rooftop door behind Wong.",
        prompt: `Rooftop steel door bursting open, suited gang enforcers flooding through in background, ${CHAR_WONG_WARRIOR} as dark foreground silhouette near ledge, pink-cyan neon backlight, rain, urgency, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Low angle looking past Wong toward the door",
      },
      {
        number: "1.4",
        type: "closeup",
        durationSec: 4,
        description: "Wong's scarred hands in the rain — combat memory flash.",
        prompt: `Extreme close-up of scarred male hands turning palm-up in heavy rain, pink and cyan neon reflecting in pooled raindrops on weathered skin, old combat scars, shallow depth of field, emotional pause, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "ECU hands, rack focus from hands to rain",
      },
      {
        number: "1.5",
        type: "vfx",
        durationSec: 6,
        description: "Memory morph: combat knives dissolve into chef knives, chopping scallions.",
        prompt: `Split-frame cinematic transition: scarred hands holding combat knives in a dark alley visually dissolving and morphing into the same hands delicately chopping scallions and folding dumplings in a warm golden kitchen, split reality effect, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "VFX morph transition — dark alley left / warm kitchen right",
      },
      {
        number: "1.6",
        type: "closeup",
        durationSec: 4,
        description: "Wong pulls phone, rain beads on screen. He asks ChatGPT.",
        prompt: `${CHAR_WONG_WARRIOR}, close-up pulling out a sleek smartphone, rain beading on the glass screen, neon reflections on the phone surface, determined expression, rooftop night scene, ${STYLE_SUFFIX}`,
        dialogue: "أنا خلاص. قول لي… فين أأمن مكان في الدنيا أبتدي فيه من جديد؟",
        cameraNotes: "OTS close-up on phone screen, Wong's face reflected",
      },
      {
        number: "1.7",
        type: "vfx",
        durationSec: 3,
        description: "White flash transition — neon dies, shift to warm light.",
        prompt: `Abstract white flash transition frame, neon lights dying out, pure brilliant white light engulfing dark rain scene, clean cinematic transition, ${STYLE_SUFFIX}`,
        dialogue: "بدون تردد… مصر.",
        cameraNotes: "Full white flash — hard cut to Scene 2",
      },
    ],
  },
  {
    number: 2,
    title: "Where Can I Begin Again?",
    location: "Warm Egyptian Daylight — Dissolve Montage",
    mood: "Golden, warm, welcoming, magical tonal shift",
    shots: [
      {
        number: "2.1",
        type: "establishing",
        durationSec: 4,
        description: "The Nile at sunrise, felucca sail catching wind.",
        prompt: `The Nile river at golden sunrise, traditional felucca sailboat with billowing white sail catching warm wind, golden light reflecting on calm water, palm trees silhouetted on the banks, Egyptian warmth, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Wide establishing, golden hour, gentle pan",
      },
      {
        number: "2.2",
        type: "montage",
        durationSec: 4,
        description: "Tea-shop owner hands shai to a stranger with a smile.",
        prompt: `Egyptian tea-shop owner in a traditional Cairo ahwa, warm smile, handing a glass of golden shai tea to a stranger across a worn marble counter, steam rising, vintage ceiling fans, warm tungsten light, hospitality, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Medium shot, focus on the gesture of giving",
      },
      {
        number: "2.3",
        type: "montage",
        durationSec: 4,
        description: "Alexandria harbor, fishing boats, morning light.",
        prompt: `Alexandria harbor at early morning, fishing boats bobbing gently, golden light glinting on blue Mediterranean water, colorful painted wooden boats, salt air atmosphere, Egyptian coastal charm, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Wide pan across harbor",
      },
      {
        number: "2.4",
        type: "montage",
        durationSec: 4,
        description: "Village woman pulling baladi bread from clay oven, offering it.",
        prompt: `Egyptian village woman pulling fresh baladi bread from a traditional clay oven (forn baladi), golden crust, offering the first steaming loaf to a passer-by with a generous smile, rustic village kitchen, warm golden light, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Close-medium, focus on bread and the offering hand",
      },
      {
        number: "2.5",
        type: "action",
        durationSec: 6,
        description: "Wong steps off dusty bus in Delta town, locals welcome him.",
        prompt: `${CHAR_WONG_WARRIOR}, stepping off a dusty local bus in a small Nile Delta village, black silken robes incongruous against ochre mud-brick walls, an old Egyptian man nodding warmly at him, a child offering bread, golden afternoon light, dust motes in air, fish-out-of-water moment, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Wide shot, Wong dwarfed by the warm village around him",
      },
    ],
  },
  {
    number: 3,
    title: "Egypt Wins His Heart",
    location: "Multiple Locations — Discovery Montage",
    mood: "Curious, warm, cultural immersion",
    shots: [
      {
        number: "3.1",
        type: "action",
        durationSec: 6,
        description: "Wong watches a family eating around a low table — molokhia, fattah.",
        prompt: `${CHAR_WONG_WARRIOR}, observing from the edge of a room, an Egyptian family gathered around a low dining table, dishes of molokhia and fattah and roz me'ammar spread across a colorful tablecloth, warm domestic light, Wong's expression curious and respectful, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Wong in foreground edge of frame, family center",
      },
      {
        number: "3.2",
        type: "vfx",
        durationSec: 4,
        description: "Wonton soup imagined on the table — it literally fades away. Wrong fit.",
        prompt: `Cinematic VFX shot: a bowl of Chinese wonton soup placed on an Egyptian family dining table, the soup bowl visually fading and dissolving away like a ghost, signifying cultural mismatch, warm domestic lighting, subtle magical realism, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Close on table, VFX fade of the wonton bowl",
      },
      {
        number: "3.3",
        type: "vfx",
        durationSec: 6,
        description: "Holographic dishes float around Wong — koshari, mahshi glows brightest.",
        prompt: `${CHAR_WONG_WARRIOR}, standing in contemplation, semi-transparent holographic Egyptian dishes floating around him like magical projections — koshari, mombar, fatta, macaroni bechamel — all dimming one by one until MAHSHI (grape leaf rolls) glows brilliant emerald green, magical food revelation, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "360-degree feeling, dishes orbiting Wong, mahshi illuminated",
      },
      {
        number: "3.4",
        type: "closeup",
        durationSec: 4,
        description: "Glowing mahshi rolls — emerald grape leaves rotating like jewels.",
        prompt: `Extreme close-up hero shot of perfectly rolled mahshi — emerald-green grape leaf rolls and pale cabbage cylinders, rotating slowly like precious jewels, warm golden backlight creating a halo, steam wisps, food photography excellence, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Macro lens, rotating food hero shot",
      },
    ],
  },
  {
    number: 4,
    title: "The Mahshi Revelation (Rural Sourcing)",
    location: "Nile Delta Village · Golden Hour",
    mood: "Reverent, quiet, warm golden hour",
    shots: [
      {
        number: "4.1",
        type: "closeup",
        durationSec: 4,
        description: "Close on baladi ghee being poured golden from a clay pot into copper pan.",
        prompt: `Extreme close-up of baladi ghee (Egyptian clarified butter) being poured warm and golden from a traditional clay pot, swirling into a hammered copper pan, rich golden liquid catching light, rustic village kitchen, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Macro, liquid pour, slow-motion feel",
      },
      {
        number: "4.2",
        type: "closeup",
        durationSec: 6,
        description: "Village grandmother's hands rolling a grape leaf in one fluid motion.",
        prompt: `Close-up of aged village grandmother's hands — knotted, sure, experienced — rolling a single grape leaf filled with rice in one fluid practiced motion, wooden cutting board, fresh herbs scattered, warm golden hour light from a window, mastery and tradition, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "ECU hands only, steady, reverent",
      },
      {
        number: "4.3",
        type: "insert",
        durationSec: 3,
        description: "Basket of fresh greens from the field — parsley, dill, mint with dew.",
        prompt: `A woven basket overflowing with freshly picked greens — flat-leaf parsley, dill fronds, mint leaves — still cool with morning dew droplets, delivered from the field, rustic wooden surface, natural daylight, fresh ingredient beauty, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Overhead insert, shallow DOF",
      },
      {
        number: "4.4",
        type: "montage",
        durationSec: 6,
        description: "Four village kitchens cross-cut: four women, four rhythms, all rolling mahshi.",
        prompt: `Split-screen montage of four different Egyptian village kitchens, four different rural women at work rolling mahshi with their own rhythm, each kitchen uniquely decorated, copper pots, gas stoves, clay ovens, steam rising, golden hour light through windows, parallel skill showcase, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Quad-split or rapid cross-cuts",
      },
      {
        number: "4.5",
        type: "action",
        durationSec: 4,
        description: "Wong bows his head slightly — a warrior recognizing masters.",
        prompt: `${CHAR_WONG_WARRIOR}, standing in a village kitchen doorway, bowing his head slightly with deep respect, backlit by golden hour light, a warrior acknowledging the mastery of village women, humble reverence, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Medium shot from inside kitchen, Wong in doorway silhouette",
      },
    ],
  },
  {
    number: 5,
    title: "Why Alexandria?",
    location: "Alexandria Corniche · Day",
    mood: "Breezy, Mediterranean, aspirational",
    shots: [
      {
        number: "5.1",
        type: "establishing",
        durationSec: 6,
        description: "Alexandria Corniche — sea breeze, turquoise Mediterranean.",
        prompt: `Alexandria Corniche wide establishing shot, turquoise Mediterranean Sea stretching to the horizon, white-railed promenade, palm trees swaying in sea breeze, pedestrians strolling, bright sunny day, Egyptian coastal beauty, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Wide drone-style establishing, gentle movement",
      },
      {
        number: "5.2",
        type: "montage",
        durationSec: 4,
        description: "Family laughing over sayadeya at a seaside café.",
        prompt: `Happy Egyptian family laughing together over plates of fresh sayadeya (fish and rice) at a seaside café terrace, Mediterranean Sea visible behind them, casual joy, warm afternoon light, Alexandrian lifestyle, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Medium shot, candid warmth",
      },
      {
        number: "5.3",
        type: "montage",
        durationSec: 3,
        description: "Old man playing oud near the boardwalk.",
        prompt: `Elderly Egyptian man playing oud instrument near the Alexandria boardwalk, weathered hands on strings, peaceful expression, sea breeze ruffling his galabiya, Mediterranean light, street musician atmosphere, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Close-medium, focus on hands and instrument",
      },
      {
        number: "5.4",
        type: "action",
        durationSec: 6,
        description: "Wong sits at ahwa table, sipping shai, watching the sea. First smile.",
        prompt: `${CHAR_WONG_WARRIOR}, sitting at a small traditional Egyptian ahwa table on the Corniche, sipping shai from a glass, watching the Mediterranean Sea, a small genuine smile on his face for the first time, sea breeze in his hair, peaceful moment, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Profile medium shot, sea bokeh behind",
      },
    ],
  },
  {
    number: 6,
    title: "The Name",
    location: "Old Alexandrian Ahwa · Evening",
    mood: "Intimate, nostalgic, revelation moment",
    shots: [
      {
        number: "6.1",
        type: "establishing",
        durationSec: 4,
        description: "Classic Alexandrian café — marble tops, ceiling fans, old TV.",
        prompt: `Interior of a classic old Alexandrian ahwa (café), marble tabletops, slow wooden ceiling fans, a beat-up CRT TV mounted high in corner, warm yellow tungsten lighting, few local men drinking tea, nostalgic Egyptian atmosphere, evening, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Wide interior establishing, warm tones",
      },
      {
        number: "6.2",
        type: "action",
        durationSec: 6,
        description: "Wong scrolling phone for brand names, frowning. TV plays behind him.",
        prompt: `${CHAR_WONG_WARRIOR}, sitting at the marble café table, scrolling his phone with a slight frown, searching for brand names, the old TV behind him playing a classic Egyptian show, other patrons relaxed around him, warm evening café light, ${STYLE_SUFFIX}`,
        dialogue: "الاسم لازم يكون مصري… يحبه المصريين…",
        cameraNotes: "Medium shot, TV visible but soft-focus behind",
      },
      {
        number: "6.3",
        type: "closeup",
        durationSec: 4,
        description: "Wong freezes mid-sip — realization. The name arrives from the TV.",
        prompt: `${CHAR_WONG_WARRIOR}, close-up face freezing mid-sip of tea, eyes widening with sudden realization, warm café light on his face, the moment of discovery, a name heard from the TV behind him, epiphany, ${STYLE_SUFFIX}`,
        dialogue: "ماما زينب!",
        cameraNotes: "ECU face, shallow DOF, hold on the realization",
      },
      {
        number: "6.4",
        type: "closeup",
        durationSec: 3,
        description: "Wong slowly lowers his glass. Full realization.",
        prompt: `${CHAR_WONG_WARRIOR}, slowly lowering his tea glass with a calm smile spreading across his face, warm café ambience, other men chuckling at the TV in background, a decision crystallizing, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Close on hands lowering glass, then tilt up to face",
      },
    ],
  },
  {
    number: 7,
    title: "Sheng El Masry",
    location: "All Over Egypt · Comic Travel Montage",
    mood: "Joyful, upbeat, transformative, comedic",
    shots: [
      {
        number: "7.1",
        type: "montage",
        durationSec: 4,
        description: "Wong in Upper Egypt (Aswan), eating mahshi with hands, laughing with family.",
        prompt: `${CHAR_WONG_WARRIOR} in dustier robes, seated on the floor with a Sa'idi Egyptian family in Upper Egypt, eating mahshi with his hands, laughing genuinely, colorful woven rugs, warm interior, cultural immersion joy, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Medium wide, Wong among the family",
      },
      {
        number: "7.2",
        type: "montage",
        durationSec: 3,
        description: "Wong in the Delta tasting cabbage rolls, eyes closing in bliss.",
        prompt: `${CHAR_WONG_WARRIOR}, tasting a cabbage mahshi roll in a Delta village kitchen (Mansoura), eyes closing in absolute bliss, steam rising from the plate, rustic but vibrant Egyptian domestic setting, food ecstasy, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Close on face, the taste moment",
      },
      {
        number: "7.3",
        type: "montage",
        durationSec: 3,
        description: "Wong on a Cairo felucca balancing a plate of warak enab.",
        prompt: `${CHAR_WONG_WARRIOR} transitioning to a linen shirt, sitting on a traditional Cairo felucca boat on the Nile, carefully balancing a plate of warak enab (grape leaf mahshi) on his knee, river breeze, golden hour, humorous balance act, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Medium, slightly comic framing",
      },
      {
        number: "7.4",
        type: "montage",
        durationSec: 3,
        description: "Wong taking selfie at koshari joint — 'Sheng El Masry' energy.",
        prompt: `${CHAR_WONG_BANKER} in tan linen trousers and casual shirt, taking a joyful selfie at a vibrant Cairo koshari restaurant, thumbs up, big smile, Egyptian street food culture around him, neon shop sign, comic joy, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "POV-style from phone angle",
      },
      {
        number: "7.5",
        type: "montage",
        durationSec: 3,
        description: "Wong studying Arabic flashcards at café, getting them all right.",
        prompt: `${CHAR_WONG_BANKER} in a transitional outfit (linen shirt, no tie), studying Arabic flashcards at a Cairo café table, intense focus, multiple cards spread out with Arabic words (صباح الخير، محشي، شكرا), warm café light, determination, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Close-medium, overhead angle on flashcards",
      },
      {
        number: "7.6",
        type: "montage",
        durationSec: 3,
        description: "Wong singing along on a microbus, passengers join in delighted.",
        prompt: `${CHAR_WONG_BANKER} in casual Egyptian dress, sitting in a crowded Egyptian microbus, singing along softly to the radio, surrounding passengers turning to look at him with surprised delight, one joining in, cramped colorful bus interior, comic joy, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Interior microbus, handheld feel",
      },
      {
        number: "7.7",
        type: "action",
        durationSec: 6,
        description: "Final transformation: Wong in cream linen suit on Corniche at sunset.",
        prompt: `${CHAR_WONG_BANKER}, standing on the Alexandria Corniche at golden sunset, crisp cream linen suit, Mediterranean Sea behind him, no longer a stranger — a man who belongs, confident calm smile, warm golden light, founder's arrival, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Wide then push-in to medium, sunset hero shot",
      },
    ],
  },
  {
    number: 8,
    title: "The Four Mothers",
    location: "Alexandria · Seaside Plaza · Day",
    mood: "Dignified competition, skill showcase, Mediterranean backdrop",
    shots: [
      {
        number: "8.1",
        type: "establishing",
        durationSec: 6,
        description: "Modest seaside stage with four cooking stations. Mediterranean behind.",
        prompt: `Wide establishing shot of a modest elegant outdoor stage on an Alexandria seaside plaza, four professional cooking stations set up, the Mediterranean Sea glinting behind, a respectful crowd of local Egyptians gathered, bunting and minimal décor, dignified competition atmosphere, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Wide crane-down establishing",
      },
      {
        number: "8.2",
        type: "action",
        durationSec: 4,
        description: "Wong at judging table announces the competition.",
        prompt: `${CHAR_WONG_BANKER}, standing behind a simple judging table with a microphone, cream linen suit, warm genuine smile, addressing four cooking stations with confidence and warmth, seaside plaza setting, founder energy, ${STYLE_SUFFIX}`,
        dialogue: "أربع أمّهات. أربع أحسن إيدين محشي في مصر.",
        cameraNotes: "Medium, Wong commanding but warm",
      },
      {
        number: "8.3",
        type: "montage",
        durationSec: 6,
        description: "Cross-cuts of four matriarchs cooking — calm, focused, formidable.",
        prompt: `Split montage of four rural Egyptian matriarchs at their cooking stations, each from a different governorate, calm focused powerful women in their element, steam rising, grape leaves being rolled, lemon squeezed, rice measured, intense skill showcase, Mediterranean breeze, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Rapid cross-cuts between the four, building rhythm",
      },
      {
        number: "8.4",
        type: "action",
        durationSec: 6,
        description: "MaMa Zainab at her station — warmest face, steadiest hands. ZuZu beside her.",
        prompt: `${CHAR_MAMA_ZAINAB}, at her cooking station in the competition, the warmest face and steadiest hands of the four competitors, rolling grape leaves with practiced mastery, ${CHAR_ZUZU} waddling quietly beside her station, Mediterranean plaza backdrop, natural skill radiating, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Medium favoring Mama Zainab, ZuZu in lower frame",
      },
    ],
  },
  {
    number: 9,
    title: "The Reveal",
    location: "Judging Table · Late Afternoon",
    mood: "Suspenseful, then emotional, fourth-wall break",
    shots: [
      {
        number: "9.1",
        type: "closeup",
        durationSec: 4,
        description: "Wong tastes with closed eyes. Three plates are excellent.",
        prompt: `${CHAR_WONG_BANKER}, close-up tasting mahshi with closed eyes, slow respectful bites, judging expression softening with each taste, elegant table setting with four beautifully plated dishes before him, afternoon light, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "ECU face, eyes closed, savoring",
      },
      {
        number: "9.2",
        type: "vfx",
        durationSec: 6,
        description: "Flavor flashback — green fields, village kitchen, grandmother's hands, ghee.",
        prompt: `Cinematic flavor-memory flashback montage: lush green Egyptian Delta fields dissolving into a warm village kitchen, aged grandmother's hands rolling mahshi, golden baladi ghee dripping, the taste IS the countryside, dreamy warm color grade, memory-sequence feel, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Dreamy dissolves, soft focus edges, memory texture",
      },
      {
        number: "9.3",
        type: "action",
        durationSec: 4,
        description: "Wong opens eyes, looks at the winning woman. 'The war is over.'",
        prompt: `${CHAR_WONG_BANKER}, opening his eyes with quiet certainty, looking toward someone off-camera with deep respect, ringing a small golden bell on the table, gentle crowd applause in background, afternoon golden light, decisive moment, ${STYLE_SUFFIX}`,
        dialogue: "الحرب خلصت.",
        cameraNotes: "Close on Wong's face, then the bell ring",
      },
      {
        number: "9.4",
        type: "action",
        durationSec: 6,
        description: "MaMa Zainab steps forward, wipes hands on apron. First direct-to-camera look.",
        prompt: `${CHAR_MAMA_ZAINAB}, stepping forward from her cooking station, wiping flour from her hands on her green plaid apron, then looking DIRECTLY INTO THE CAMERA for the first time, warm knowing maternal smile, golden afternoon light creating a halo around her headscarf, the hero revealed, ${STYLE_SUFFIX}`,
        dialogue: "الستّ اللي كسبت لقب ماما زينب دي… هي أنا.",
        cameraNotes: "Push-in to direct-address close-up, eye contact with lens",
      },
      {
        number: "9.5",
        type: "action",
        durationSec: 4,
        description: "ZuZu waddles into frame beside her. One honk. Crowd laughs.",
        prompt: `${CHAR_MAMA_ZAINAB} in frame left, ${CHAR_ZUZU} waddling confidently into frame from the right, taking position beside Mama Zainab's feet, the goose looking up at her then at camera, comedic timing, crowd visible laughing in soft background, warm afternoon light, ${STYLE_SUFFIX}`,
        dialogue: "ودي زوزو. وزّتي البيضا الحلوة.",
        cameraNotes: "Medium wide to include ZuZu's entrance, hold for the honk",
      },
    ],
  },
  {
    number: 10,
    title: "The Brand Promise (Fairytale Finale)",
    location: "Alexandria · Golden Hour — Direct Address",
    mood: "Warm, triumphant, fairy-tale conclusion",
    shots: [
      {
        number: "10.1",
        type: "establishing",
        durationSec: 6,
        description: "MaMa Zainab on Corniche, sea behind, ZuZu at feet, Wong a step behind.",
        prompt: `${CHAR_MAMA_ZAINAB} standing on the Alexandria Corniche at golden hour, Mediterranean Sea sparkling behind her, ${CHAR_ZUZU} at her feet, ${CHAR_WONG_BANKER} standing a respectful step behind her with a warm smile, this is HER story now, golden sunset light, brand hero composition, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Wide hero shot, Mama Zainab center, Wong respectfully behind",
      },
      {
        number: "10.2",
        type: "dialogue",
        durationSec: 6,
        description: "MaMa Zainab addresses camera — the brand promise speech.",
        prompt: `${CHAR_MAMA_ZAINAB}, close-up direct address to camera, warm maternal eyes crinkling with a smile, golden sunset light on her olive skin, cream headscarf glowing, speaking with quiet authority and love, the Mediterranean a soft blue bokeh behind her, ${STYLE_SUFFIX}`,
        dialogue: "ومن النهارده، جه الوقت اللي أهل البندر… يدوقوا أحلى أكل فلاحي.",
        cameraNotes: "Close-up, direct-to-camera, golden hour beauty light",
      },
      {
        number: "10.3",
        type: "insert",
        durationSec: 4,
        description: "Young woman receives Mama Zainab branded box — opens it — perfect mahshi.",
        prompt: `A young Alexandrian woman in modern office wear, receiving a neat branded delivery box with "ماما زينب" logo, opening it to reveal perfectly plated steaming mahshi rolls arranged like jewels, her eyes closing in delight at first bite, modern Egyptian lifestyle, ${STYLE_SUFFIX}`,
        dialogue: "أكل شرقي… فاست فود.",
        cameraNotes: "Medium close, food reveal moment",
      },
      {
        number: "10.4",
        type: "action",
        durationSec: 4,
        description: "Back to Mama Zainab — she smiles, pats ZuZu gently.",
        prompt: `${CHAR_MAMA_ZAINAB}, back on the Corniche at sunset, smiling warmly into camera, looking down and gently patting ${CHAR_ZUZU} who nuzzles her hand, warm fairy-tale ending energy, golden light, ${STYLE_SUFFIX}`,
        dialogue: "وتوتة توتة… خلصت الحدوتة.",
        cameraNotes: "Medium, sunset glow, gentle ending",
      },
      {
        number: "10.5",
        type: "establishing",
        durationSec: 6,
        description: "Sun dips into Mediterranean. Brand mark fades in. FADE OUT.",
        prompt: `Wide cinematic shot of the Mediterranean sunset from Alexandria, the sun dipping below the horizon, golden and magenta sky reflected on calm water, the brand mark "ماما زينب · Mama Zainab" subtly composited over the sea, final frame, fade to black, ${STYLE_SUFFIX}`,
        dialogue: "",
        cameraNotes: "Ultra-wide, sunset, logo appear, fade out",
      },
    ],
  },
];

/* ---- Build videos.json structure ---- */

function makeId(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6)}`;
}

async function main() {
  const now = new Date().toISOString();

  // Read existing to preserve any takes/approvals
  const existing = JSON.parse(await readFile(VIDEOS_PATH, "utf-8"));

  // Build new scenes
  const scenes = SCENES.map((s, i) => ({
    id: `scene_${s.number}`,
    projectId: PROJECT_ID,
    number: s.number,
    title: s.title,
    location: s.location,
    mood: s.mood,
    sort: i + 1,
    createdAt: now,
    updatedAt: now,
  }));

  // Build new shots
  const shots = SCENES.flatMap((scene) =>
    scene.shots.map((shot, i) => ({
      id: makeId("shot"),
      projectId: PROJECT_ID,
      sceneId: `scene_${scene.number}`,
      number: shot.number,
      type: shot.type,
      durationSec: shot.durationSec,
      description: shot.description,
      dialogue: shot.dialogue,
      cameraNotes: shot.cameraNotes,
      prompt: shot.prompt,
      referenceUrls: [],
      status: "pending",
      approvedTakeId: "",
      sort: i + 1,
      keyframeUrl: "",
      keyframeApprovedAt: "",
      keyframeSeed: 0,
      keyframeHistory: [],
      audio: null,
      createdAt: now,
      updatedAt: now,
    })),
  );

  // Summary
  console.log(`\n📝 New Script → Shot Structure:`);
  console.log(`   Scenes: ${scenes.length}`);
  console.log(`   Shots:  ${shots.length}`);
  console.log(`\n   Per scene:`);
  for (const s of SCENES) {
    console.log(`     Scene ${s.number}: "${s.title}" — ${s.shots.length} shots`);
  }

  // Character usage
  const charCounts = {
    mama_zainab: shots.filter((s) => s.prompt.includes("<lora:mama_zainab>")).length,
    wong_warrior: shots.filter((s) => s.prompt.includes("<lora:wong_warrior>")).length,
    wong_banker: shots.filter((s) => s.prompt.includes("<lora:wong_banker>")).length,
    zuzu: shots.filter((s) => s.prompt.includes("<lora:zuzu>")).length,
  };
  console.log(`\n   Character LoRA usage:`);
  console.log(`     MaMa Zainab:  ${charCounts.mama_zainab} shots`);
  console.log(`     Wong Warrior: ${charCounts.wong_warrior} shots`);
  console.log(`     Wong Banker:  ${charCounts.wong_banker} shots`);
  console.log(`     ZuZu:         ${charCounts.zuzu} shots`);

  if (DRY_RUN) {
    console.log(`\n⏸️  DRY RUN — no changes written.`);
    console.log(`   Run without --dry-run to update videos.json`);
    return;
  }

  // Write updated videos.json
  const output = {
    ...existing,
    version: (existing.version ?? 1) + 1,
    scenes,
    shots,
    takes: existing.takes ?? [],  // preserve any existing takes
  };

  await writeFile(VIDEOS_PATH, JSON.stringify(output, null, 2) + "\n", "utf-8");
  console.log(`\n✅ Written to ${VIDEOS_PATH}`);
  console.log(`   Old: ${existing.scenes?.length ?? 0} scenes, ${existing.shots?.length ?? 0} shots`);
  console.log(`   New: ${scenes.length} scenes, ${shots.length} shots`);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
