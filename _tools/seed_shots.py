"""
Seed all 33 shots (with Veo 3 prompts) into 11_AdminUI/data/videos.json.
Preserves existing project, scenes, and the one existing take.
Replaces the 6 placeholder shots with the full storyboard shot list.
Run from workspace root: python _tools/seed_shots.py
"""

import json, random, string
from datetime import datetime

DATA_PATH = "11_AdminUI/data/videos.json"
NOW = "2026-05-03T22:30:00.000Z"
PROJECT_ID = "prj_brand_incorporation"

SCENE = {
    1: "scn_tEp-9I6Y",
    2: "scn_K8ZV5coB",
    3: "scn_K8otx08L",
    4: "scn_-Ny5jOEY",
    5: "scn_Wie842Ui",
    6: "scn_8lBsgWoj",
}

# Preserve ID for shot 1.1 (the existing take references it)
KEEP_IDS = {"1.1": "shot_qU90zVUk"}

def uid():
    return "shot_" + "".join(random.choices(string.ascii_letters + string.digits, k=8))

NEGATIVE = (
    "no logos, no readable text, no warped faces, no extra fingers, "
    "no duplicated characters, no plastic skin, no AI artifact shimmer, "
    "no cartoon style, no anime, no watermark"
)

STYLE = (
    "shot on ARRI Alexa 35, anamorphic 2.39:1, cinematic color grade, "
    "warm Mediterranean highlights + cool teal shadows, volumetric haze, "
    "photoreal, film grain, no text overlay"
)

SHOTS = [
    # ── SCENE 1 ─────────────────────────────────────────────────────────────
    {
        "number": "1.1", "sceneN": 1, "type": "aerial", "dur": 4,
        "description": "Slow descent through neon-soaked Hong-Kong-style cityscape. Rain in slow motion. Mob swarms the building below.",
        "dialogue": "",
        "cameraNotes": "Establishing aerial. Slow descent. Blade Runner 2049 mood.",
        "prompt": (
            "Establishing aerial shot, 4 seconds. Cinematic dystopian city at night, torrential "
            "rain in slow motion, dense forest of skyscrapers covered in pink, cyan and magenta "
            "neon Chinese signage. Camera descends slowly between the towers toward a single "
            "illuminated rooftop. Wet reflective streets below. Volumetric fog. Blade Runner "
            "2049 mood. Anamorphic 2.39:1. ARRI Alexa 35, no text or logos visible. "
            "Audio: distant thunder, rain, low synth drone. " + NEGATIVE
        ),
    },
    {
        "number": "1.2", "sceneN": 1, "type": "medium", "dur": 3,
        "description": "Wong silhouetted at skyscraper edge, wind whipping his coat, neon city glowing far below.",
        "dialogue": "",
        "cameraNotes": "Low angle hero. Slow push-in. Back three-quarters to camera.",
        "prompt": (
            "Cinematic medium-wide, 3 seconds. East-Asian man in his 60s [REF:WongHong.png], "
            "silver-streaked hair, weathered face, wearing dark silken warrior robes that "
            "billow in heavy wind and rain, standing at the edge of a rain-soaked skyscraper "
            "rooftop, neon city glowing far below, back three-quarters to camera, looking "
            "down at his own hands. Slow push-in. Anamorphic, shallow depth of field, "
            "photoreal, film grain. Audio: rain, wind, faint heartbeat. " + NEGATIVE
        ),
    },
    {
        "number": "1.3", "sceneN": 1, "type": "insert", "dur": 2,
        "description": "His scarred hands turning over, rain rinsing blood in the neon glow.",
        "dialogue": "",
        "cameraNotes": "Extreme close-up insert. Hands only. Neon reflections in the rain droplets.",
        "prompt": (
            "Extreme close-up insert, 2 seconds. Scarred, weathered East-Asian male hands "
            "turning palm-up in heavy rain on a rain-soaked skyscraper rooftop. Pink and cyan "
            "neon light reflects in pooled rainwater on the skin. Slow motion. Anamorphic, "
            "shallow DOF, photoreal, film grain. Audio: rain, low heartbeat. " + NEGATIVE
        ),
    },
    {
        "number": "1.4", "sceneN": 1, "type": "ots", "dur": 4,
        "description": "Glass-morphic smartphone glowing with ChatGPT interface. Wong's dialogue to the AI.",
        "dialogue": "我厌倦了战争。告诉我... 地球上哪里没有人会来找战士，而食物可以治愈破碎的灵魂？\n(I'm done with the war. Tell me... where is the one place on Earth where no one will look for a fighter, and the food can heal a broken soul?)",
        "cameraNotes": "Macro insert. Rack focus raindrops → screen. Neon reflections in droplets.",
        "prompt": (
            "Macro insert, 4 seconds. A weathered hand holds a sleek glass-morphic smartphone "
            "in pouring rain, water beads on the screen. Floating holographic ChatGPT "
            "interface glows softly. Slow rack focus from raindrops to the screen. "
            "Anamorphic, shallow DOF, neon reflections in droplets, photoreal. "
            "Dialogue (Mandarin Chinese, weary male voice, ~60yo): "
            "'我厌倦了战争。告诉我... 地球上哪里没有人会来找战士，而食物可以治愈破碎的灵魂？' "
            "Audio: rain, holographic UI hum. " + NEGATIVE
        ),
    },
    {
        "number": "1.5", "sceneN": 1, "type": "wide", "dur": 3,
        "description": "Mob of suits and street fighters bursting through the rooftop door behind Wong.",
        "dialogue": "CHATGPT (V.O.): Searching... Analysis complete. You seek peace and Comfort Food. Go to Egypt.",
        "cameraNotes": "Reverse low angle. Wong foreground, door background.",
        "prompt": (
            "Cinematic wide, 3 seconds. Reverse low-angle shot. Rooftop in pouring neon rain. "
            "In the background, a steel rooftop door bursts open - a mob of suited men and "
            "street fighters floods through. In the foreground, the dark silhouette of a "
            "warrior-robed man. Tension, threat, urgency. Anamorphic, high contrast, "
            "pink-cyan neon color, photoreal. Audio: door crash, shouting, rain. " + NEGATIVE
        ),
    },
    {
        "number": "1.6", "sceneN": 1, "type": "wide", "dur": 3,
        "description": "Wong dives backward off the roof edge into the neon glow - dissolves to white.",
        "dialogue": "",
        "cameraNotes": "Match-cut leap. Camera rushes to edge. White dissolve.",
        "prompt": (
            "Cinematic wide, 3 seconds. A warrior-robed East-Asian man takes one step backward "
            "off the edge of a rain-soaked skyscraper rooftop, arms slightly open, face calm, "
            "neon city a glittering abyss below him. Camera rushes forward to the edge. "
            "As he falls, the neon glow overwhelms the frame in a white dissolve. "
            "Slow motion. Anamorphic, photoreal, film grain. Audio: silence → swelling synth. "
            + NEGATIVE
        ),
    },
    # ── SCENE 2 ─────────────────────────────────────────────────────────────
    {
        "number": "2.1", "sceneN": 2, "type": "aerial", "dur": 6,
        "description": "360-degree drone orbit around apex of Great Pyramid. Wong meditating in warrior robes at the summit.",
        "dialogue": "",
        "cameraNotes": "Hero drone shot. Full 360 orbit. Long shadow. Deep teal sky.",
        "prompt": (
            "Cinematic drone orbit, 6 seconds, 360-degree slow circle around the apex of the "
            "Great Pyramid of Giza at high noon. Vast Giza desert and distant Cairo skyline "
            "shimmer in heat haze. Seated cross-legged on the weathered limestone summit: "
            "East-Asian man in his 60s [REF:WongHong.png], silver-streaked hair, dark silken "
            "warrior robes rippling in the desert wind, eyes closed in deep meditation, "
            "perfectly still. Long shadow. Anamorphic 2.39:1, ARRI Alexa 35, photoreal, "
            "warm desert highlights, deep teal sky. Audio: low wind, distant hawk cry, sparse "
            "ney flute drone. " + NEGATIVE
        ),
    },
    {
        "number": "2.2", "sceneN": 2, "type": "medium", "dur": 4,
        "description": "Wong slowly opens his eyes and raises the glass-morphic phone to the blazing sky.",
        "dialogue": "I am in position. Tell me... what is the ultimate strike in this market?",
        "cameraNotes": "Low push-in. Desert heat shimmer. Calm authority.",
        "prompt": (
            "Cinematic medium close-up, 4 seconds. East-Asian man in his 60s [REF:WongHong.png] "
            "seated cross-legged on the Great Pyramid apex, slowly opens his eyes - calm, "
            "tactical. He raises a glass-morphic smartphone toward the blazing noon sky. "
            "Desert light rims his weathered face. Shallow DOF, heat haze bokeh behind him. "
            "Anamorphic, photoreal. Dialogue (Mandarin accent, calm-commanding English): "
            "'I am in position. Tell me... what is the ultimate strike in this market?' "
            "Audio: desert wind, distant hawk, AI UI chime. " + NEGATIVE
        ),
    },
    {
        "number": "2.3", "sceneN": 2, "type": "insert", "dur": 4,
        "description": "HUD insert - smartphone above pyramid limestone. Holographic Egyptian market data, Alexandria pulsing dot, dish illustrations.",
        "dialogue": "CHATGPT (V.O.): Analyzing Egyptian market sentiment... The highest emotional currency in Egypt is Original Home Food.",
        "cameraNotes": "Tight OTS. Translucent holographic UI. Sun-drenched, warm rim light.",
        "prompt": (
            "Tight over-shoulder, 4 seconds. Same warrior holding a glass-morphic smartphone "
            "above the limestone of the pyramid. Translucent holographic UI floats above the "
            "screen showing Arabic-language data charts, Egyptian map with pulsing dot on "
            "Alexandria, and dish illustrations (mahshi, mombar, macaroni bechamel). "
            "Sun-drenched, warm rim light, depth of field shallow. Photoreal. No readable "
            "brand text. Audio: quiet electronic AI tone, soft chime. " + NEGATIVE
        ),
    },
    {
        "number": "2.4", "sceneN": 2, "type": "medium", "dur": 3,
        "description": "Wong stands. Wind catches his robes like storm clouds against the bright pyramid sky.",
        "dialogue": "Mama Zainab. It is decided.",
        "cameraNotes": "Low angle. Robes billowing. Strong silhouette against blue sky.",
        "prompt": (
            "Cinematic low-angle medium, 3 seconds. East-Asian warrior [REF:WongHong.png] "
            "rises to standing on the Great Pyramid apex. The desert wind catches his dark "
            "silken robes, making them billow dramatically like storm clouds against a vivid "
            "blue Egyptian sky. Decisive posture. Anamorphic, strong upward angle, "
            "warm backlight, photoreal. Dialogue: 'Mama Zainab. It is decided.' "
            "Audio: rising ney flute, desert wind. " + NEGATIVE
        ),
    },
    {
        "number": "2.5", "sceneN": 2, "type": "wide", "dur": 3,
        "description": "Wong at pyramid peak, looking north toward the invisible Mediterranean coast. Small dangerous smile.",
        "dialogue": "The ultimate proving ground...",
        "cameraNotes": "Wide back. Robes billow. Looking north. North light.",
        "prompt": (
            "Cinematic wide, 3 seconds. From behind: East-Asian warrior in dark robes stands "
            "at the very apex of the Great Pyramid, looking north. The vast Egyptian landscape "
            "stretches below him. A small, almost imperceptible smile. Wind whips his robes. "
            "Anamorphic, golden side-light, deep blue northern sky, photoreal. "
            "Dialogue (quiet, to himself): 'The ultimate proving ground...' "
            "Audio: rising strings, wind. " + NEGATIVE
        ),
    },
    {
        "number": "2.6", "sceneN": 2, "type": "aerial", "dur": 4,
        "description": "Wong steps to the edge and dives off the pyramid. Camera rushes to follow - he's already gone, swallowed by a dust devil.",
        "dialogue": "Time to find the first Mama Zainab.",
        "cameraNotes": "High angle top-down then rush to edge. Dust devil swallows him.",
        "prompt": (
            "Cinematic aerial, 4 seconds. From above: East-Asian warrior stands at the very "
            "apex of the Great Pyramid and steps off the edge without hesitation. "
            "The camera plunges forward to the edge - he is already gone, "
            "vanished into a swirling desert dust devil far below. Only wind and ancient stone. "
            "CUT TO BLACK. Anamorphic, photoreal, dramatic. Dialogue (voice-over): "
            "'Time to find the first Mama Zainab.' Audio: orchestral sting, dust rush. "
            + NEGATIVE
        ),
    },
    # ── SCENE 3 ─────────────────────────────────────────────────────────────
    {
        "number": "3.1", "sceneN": 3, "type": "aerial", "dur": 4,
        "description": "Mediterranean coastline reveal - giant competition stage with hundreds of cooking stations in an Alexandria grand plaza.",
        "dialogue": "",
        "cameraNotes": "Sweeping drone. Coastal reveal. Golden hour. Lens flare.",
        "prompt": (
            "Sweeping drone shot, 4 seconds. Coastal Alexandria, Egypt at golden hour, the "
            "Mediterranean sparkling. Camera flies over the iconic corniche then reveals a "
            "massive open-air food competition stage in a grand plaza: dozens of stainless "
            "steel cooking stations arranged in rows, each manned by a woman cook, large "
            "crowd cheering. Volumetric sun rays, lens flare, anamorphic, photoreal, "
            "warm sunset palette. Audio: cheering crowd, oud + light percussion. " + NEGATIVE
        ),
    },
    {
        "number": "3.2", "sceneN": 3, "type": "medium", "dur": 3,
        "description": "Wong (now in cream linen suit, calm authority) at judging table with vintage brass microphone. The casting call begins.",
        "dialogue": "I have traveled across the world to find the perfect roll. The one who creates the ultimate Sobah Mahshi wins my life's fortune. You will be... our MaMa Zainab. Begin!",
        "cameraNotes": "Hero medium. Golden-hour key light. Rows of cooks bokeh'd out behind.",
        "prompt": (
            "Cinematic medium, 3 seconds. The same East-Asian man [REF:WongHong.png] now "
            "transformed - clean-shaven, hair tied back, wearing a premium minimalist "
            "cream-linen suit, standing behind a long judging table, holding a vintage "
            "brass microphone. Background: rows of cooks bokeh'd out. Calm authority. "
            "Anamorphic, soft golden-hour key light, photoreal. "
            "Dialogue (English with thick Mandarin accent, broken Egyptian Arabic mix): "
            "'I have traveled across the world to find the perfect roll. The one who "
            "creates the ultimate Sobah Mahshi wins my life's fortune. You will be... "
            "our MaMa Zainab. Begin!' Audio: crowd hush, mic feedback, then silence. "
            + NEGATIVE
        ),
    },
    {
        "number": "3.3", "sceneN": 3, "type": "tracking", "dur": 4,
        "description": "Tracking shot glides past dozens of women in colorful aprons, rolling grape leaves and stuffed vegetables. Scent of lemon, garlic and mint.",
        "dialogue": "",
        "cameraNotes": "Long lateral tracking shot. Women working at cooking stations.",
        "prompt": (
            "Cinematic lateral tracking shot, 4 seconds. Camera glides slowly along a row of "
            "dozens of Egyptian women at stainless steel cooking stations in an open-air plaza. "
            "Each woman works with practiced hands: rolling grape leaves, stuffing peppers "
            "and zucchini, arranging mahshi. Colorful traditional dress and aprons. "
            "Steam and herbs. Golden Mediterranean sunlight. Anamorphic, shallow DOF, "
            "warm palette, photoreal. Audio: kitchen sounds, crowd murmur, oud melody. "
            + NEGATIVE
        ),
    },
    {
        "number": "3.4", "sceneN": 3, "type": "wide", "dur": 2,
        "description": "Reaction shot - excited Alexandria crowd in the bleachers, electric anticipation.",
        "dialogue": "",
        "cameraNotes": "Wide crowd shot. Energy, diversity, anticipation.",
        "prompt": (
            "Cinematic wide, 2 seconds. Bleachers filled with an excited Alexandria crowd - "
            "diverse ages, men and women, leaning forward in anticipation. Mediterranean sun. "
            "Some hold up phones, others shout encouragement. Energy and joy. "
            "Anamorphic, warm golden afternoon light, photoreal. "
            "Audio: crowd cheer, oud sting. " + NEGATIVE
        ),
    },
    # ── SCENE 4 ─────────────────────────────────────────────────────────────
    {
        "number": "4.1", "sceneN": 4, "type": "medium", "dur": 3,
        "description": "Mama Zainab and ZuZu the goose at her station - calm precision. The perfect two-shot.",
        "dialogue": "",
        "cameraNotes": "Medium two-shot. Cast lock. Golden hour outdoor stage.",
        "prompt": (
            "Cinematic medium two-shot, 3 seconds. An Egyptian woman in her 50s "
            "[REF:Mama Zainab (Final).jpeg], warm kind face, headscarf, wearing a GREEN-base "
            "plaid apron with yellow stripes and white weft (woven texture), hand-rolling a "
            "grape leaf with calm precision at a stainless cooking station. Beside her: a "
            "plump white goose [REF:ZuZu.JPEG] wearing a tiny matching plaid ribbon, alert "
            "and proud. Sunlit outdoor stage, shallow DOF, anamorphic, photoreal, warm "
            "golden-hour light. Audio: ambient crowd, soft kitchen clink, comic flute motif. "
            + NEGATIVE
        ),
    },
    {
        "number": "4.2", "sceneN": 4, "type": "medium", "dur": 2,
        "description": "Ghost of Mama Zainab - translucent luminous-green younger self - shimmers into existence beside her. Only Zainab and ZuZu can see her.",
        "dialogue": "",
        "cameraNotes": "VFX shimmer reveal. Pale green glow #1B9B00 @ 30%. Wind particles.",
        "prompt": (
            "Cinematic medium, 2 seconds. A pale luminous-green translucent younger version "
            "of the same Egyptian woman shimmers into existence beside Mama Zainab, like "
            "heat haze made visible, edges glowing soft #1B9B00 green. Only Mama Zainab and "
            "the white goose can see her. Photoreal compositing, anamorphic, gentle wind "
            "particles. Audio: soft chime, low hum. " + NEGATIVE
        ),
    },
    {
        "number": "4.3", "sceneN": 4, "type": "insert", "dur": 2,
        "description": "Comedic sabotage: rival chef reaches for salt - ZuZu trips her - she dumps a whole bag of sugar into the pot.",
        "dialogue": "",
        "cameraNotes": "Quick comedic insert. Slapstick timing. Cartoon sound effect.",
        "prompt": (
            "Quick comedic insert, 2 seconds. A high-end chef in pristine white reaches "
            "across her station for a salt jar; a plump white goose [REF:ZuZu.JPEG] darts "
            "between her ankles and trips her; she stumbles forward, accidentally upending "
            "a giant paper bag of sugar into a bubbling cooking pot. Slapstick timing. "
            "Cinematic anamorphic, photoreal, comedy beat, sound effect: cartoon 'boing' "
            "+ pour. " + NEGATIVE
        ),
    },
    {
        "number": "4.4", "sceneN": 4, "type": "insert", "dur": 2,
        "description": "Mob saboteur in cook disguise tries to tip Zainab's table - the Ghost blows an ice wind that freezes his hands to his own pot.",
        "dialogue": "",
        "cameraNotes": "Quick insert. VFX ice wind from Ghost. Frozen hands gag.",
        "prompt": (
            "Quick comedic insert, 2 seconds. A large man disguised as a cook reaches out to "
            "tip a cooking station - the pale green translucent Ghost of Mama Zainab extends "
            "a hand and blows a supernatural cold wind. Ice crystals form instantly around "
            "the man's hands, freezing them to his own copper pot. His shocked face. "
            "Anamorphic, VFX photoreal, comic timing. Audio: ice crack, cartoon freeze SFX. "
            + NEGATIVE
        ),
    },
    {
        "number": "4.5", "sceneN": 4, "type": "insert", "dur": 2,
        "description": "ZuZu flaps wings wildly - a flour cloud billows into the faces of three rival cooks mid-plate.",
        "dialogue": "",
        "cameraNotes": "Quick insert. ZuZu hero moment. Flour slow-motion.",
        "prompt": (
            "Quick comedic insert, 2 seconds. A plump white goose [REF:ZuZu.JPEG] stands on "
            "a cooking counter and flaps its wings vigorously, launching a massive cloud of "
            "white flour into the air. In slow motion, the flour engulfs the faces of three "
            "rival cooks just as they are about to plate their dishes, blinding them. "
            "Anamorphic, slow-motion, photoreal, comic timing. Audio: flapping, 'whoosh', "
            "comedy string sting. " + NEGATIVE
        ),
    },
    {
        "number": "4.6", "sceneN": 4, "type": "close-up", "dur": 2,
        "description": "Mama Zainab quietly plates one perfect emerald-green mahshi finger amid the chaos. Total serenity.",
        "dialogue": "",
        "cameraNotes": "Reset close-up. Calm amid chaos. Macro on the mahshi finger.",
        "prompt": (
            "Cinematic close-up, 2 seconds. Chaos in the background (blurred). In the "
            "foreground: the warm weathered hands of an Egyptian woman [REF:Mama Zainab (Final).jpeg] "
            "carefully place a single, perfect, emerald-green grape-leaf mahshi finger onto "
            "a pristine white plate. Total calm. Steam rises. Golden light. "
            "Anamorphic, macro detail, photoreal. Audio: crowd chaos fades to silence, "
            "single piano note. " + NEGATIVE
        ),
    },
    # ── SCENE 5 ─────────────────────────────────────────────────────────────
    {
        "number": "5.1", "sceneN": 5, "type": "macro", "dur": 2,
        "description": "Top-down: one perfectly cylindrical emerald-green mahshi finger on a white plate before Wong. Silence.",
        "dialogue": "",
        "cameraNotes": "Top-down macro. Minimalist plate presentation. Silence drops.",
        "prompt": (
            "Cinematic top-down macro, 2 seconds. A single, perfectly cylindrical, "
            "emerald-green grape-leaf mahshi finger rests on a pristine white plate "
            "on a wooden judging table. Perfect form. Steam rises in slow motion. "
            "Soft window light. Extreme shallow DOF, anamorphic, photoreal. "
            "Audio: total silence. " + NEGATIVE
        ),
    },
    {
        "number": "5.2", "sceneN": 5, "type": "close-up", "dur": 3,
        "description": "Wong picks up the mahshi. He takes a deliberate, ceremonial bite. The crowd holds its breath.",
        "dialogue": "",
        "cameraNotes": "Close-up on hands then face. Intercut. Weight of the moment.",
        "prompt": (
            "Cinematic close-up sequence, 3 seconds. First: weathered East-Asian hands pick "
            "up the single emerald mahshi finger from the white plate. Then: medium close-up "
            "of the man's face [REF:WongHong.png] as he takes a slow, deliberate, ceremonial "
            "bite. His expression is unreadable. The crowd noise has vanished. "
            "Anamorphic, warm key light, photoreal, film grain. Audio: absolute silence, "
            "then one crunch. " + NEGATIVE
        ),
    },
    {
        "number": "5.3", "sceneN": 5, "type": "wide", "dur": 4,
        "description": "VFX flavor explosion - rapid dream flashes: sunlit green fields, stone oven, mother's flour-dusted hands, copper pot steam, blue door.",
        "dialogue": "",
        "cameraNotes": "VFX montage. Warm light flares. Dissolve cuts. Nostalgic film grain.",
        "prompt": (
            "Cinematic VFX montage, 4 seconds. From inside a man's closed eyes: rapid dream "
            "flashes - sunlit Egyptian village green fields rolling in wind, an old stone "
            "oven glowing orange, a mother's flour-dusted hands rolling grape leaves on a "
            "wooden table, steam rising from a copper pot, a sun-bleached blue door. Each "
            "image dissolves into the next on warm light flares. Anamorphic, photoreal, "
            "nostalgic film-grain, golden hour. Audio: swelling strings + ney flute, soft "
            "heartbeat. " + NEGATIVE
        ),
    },
    {
        "number": "5.4", "sceneN": 5, "type": "medium", "dur": 3,
        "description": "Wong's eyes meet Mama Zainab's across the judging table. Quietly: 'The war is finally over.'",
        "dialogue": "The war is finally over.",
        "cameraNotes": "Hero medium. Tight two-shot. Emotional peak.",
        "prompt": (
            "Cinematic medium shot, 3 seconds. East-Asian man in his 60s [REF:WongHong.png] "
            "across a judging table, eyes meeting those of an Egyptian woman in her 50s "
            "[REF:Mama Zainab (Final).jpeg]. A long, charged moment of recognition. "
            "His eyes soften. Warm golden light. Shallow DOF. Anamorphic, photoreal. "
            "Dialogue (quiet, Mandarin accent): 'The war is finally over.' "
            "Audio: swelling strings resolve to silence. " + NEGATIVE
        ),
    },
    {
        "number": "5.5", "sceneN": 5, "type": "wide", "dur": 3,
        "description": "Wong rings a massive golden bell. The plaza crowd erupts. Confetti rains. The brand is born.",
        "dialogue": "",
        "cameraNotes": "Wide hero shot. Golden bell sting. Confetti explosion. Joy.",
        "prompt": (
            "Cinematic wide, 3 seconds. The East-Asian man in cream linen suit [REF:WongHong.png] "
            "reaches up and strikes a massive ornate golden bell. The sound rings out. "
            "The packed Alexandria plaza crowd erupts in cheers, applause and joy. "
            "Confetti in green (#1B9B00) and yellow (#EFD200) rains down from above. "
            "Warm golden sunset, lens flare, anamorphic, photoreal. "
            "Audio: bell gong, crowd roar, triumphant orchestra sting. " + NEGATIVE
        ),
    },
    # ── SCENE 6 ─────────────────────────────────────────────────────────────
    {
        "number": "6.1", "sceneN": 6, "type": "wide", "dur": 4,
        "description": "Wide reveal: Apple-store-clean minimalist office above Alexandria harbor. Floating holographic menus in brand green and yellow.",
        "dialogue": "",
        "cameraNotes": "Slow dolly forward. Floor-to-ceiling windows. Sunset harbor.",
        "prompt": (
            "Cinematic wide establishing, 4 seconds. Minimalist Apple-store-clean executive "
            "office, floor-to-ceiling windows overlooking Alexandria harbor at sunset. "
            "Floating translucent holographic menus and growth charts hover above glass "
            "desks. Brand color accents: #1B9B00 green and #EFD200 yellow on UI panels. "
            "Slow dolly forward. Anamorphic, photoreal, warm sunset rim light. No readable "
            "text on holograms. Audio: ambient harbor sound, soft orchestral theme. " + NEGATIVE
        ),
    },
    {
        "number": "6.2", "sceneN": 6, "type": "medium", "dur": 3,
        "description": "Mama Zainab in plaid apron laughs softly as she feeds ZuZu a piece of bread. Ghost of Zainab sits peacefully on the windowsill.",
        "dialogue": "",
        "cameraNotes": "Corner kitchen. Sun-drenched. Ghost barely visible on windowsill.",
        "prompt": (
            "Cinematic medium, 3 seconds. Same Egyptian woman [REF:Mama Zainab (Final).jpeg] "
            "in green-base plaid apron with yellow stripes, laughing softly as she feeds a "
            "piece of bread to a plump white goose [REF:ZuZu.JPEG]. Sun-drenched corner "
            "kitchen. On the windowsill behind her, barely visible, a faint translucent "
            "green-glowing female figure sits peacefully (Ghost of Zainab). Anamorphic, "
            "shallow DOF, golden hour, photoreal. Audio: gentle laughter, distant gull. "
            + NEGATIVE
        ),
    },
    {
        "number": "6.3", "sceneN": 6, "type": "insert", "dur": 2,
        "description": "Insert: a vintage red telephone rings on a glass desk. Zainab wipes her hands on her apron and answers.",
        "dialogue": "",
        "cameraNotes": "Macro insert on red phone. Practical ring light.",
        "prompt": (
            "Macro insert, 2 seconds. A classic vintage red telephone sits on a minimalist "
            "glass desk in an elegant office. It rings. A flour-dusted hand wipes on a "
            "green-yellow plaid apron and reaches for the receiver. "
            "Warm light, shallow DOF, anamorphic, photoreal. Audio: vintage ring, "
            "fabric rustle. " + NEGATIVE
        ),
    },
    {
        "number": "6.4", "sceneN": 6, "type": "medium", "dur": 4,
        "description": "Intercut: Wong seen only in silhouette against a massive penthouse window, the Mediterranean beyond him. 'The London branch is asking for more garlic.'",
        "dialogue": "The London branch is asking for more garlic in the sauce. What is your decision, Mama?",
        "cameraNotes": "Silhouette only. Backlit by window. The mysterious Banker.",
        "prompt": (
            "Cinematic medium, 4 seconds. A male figure silhouetted against a massive "
            "floor-to-ceiling penthouse window overlooking the sea at dusk. "
            "No facial features visible - pure dark silhouette of a tall man in "
            "a well-cut suit, holding a phone to his ear. Like the mysterious 'Banker'. "
            "Warm amber light around the edges of the silhouette. Anamorphic, photoreal. "
            "Dialogue (voice-only, measured Mandarin accent): 'The London branch is "
            "asking for more garlic in the sauce. What is your decision, Mama?' "
            "Audio: harbor ambience, quiet strings. " + NEGATIVE
        ),
    },
    {
        "number": "6.5", "sceneN": 6, "type": "close-up", "dur": 3,
        "description": "Close-up: Mama Zainab smiling, utterly certain. 'Tell them no. In this kitchen, we do it the village way, or not at all.'",
        "dialogue": "Tell them no. In this kitchen, we do it the village way, or not at all.",
        "cameraNotes": "Hero close. Matriarchal authority. Warm kitchen light.",
        "prompt": (
            "Cinematic close-up, 3 seconds. Egyptian woman in her 50s [REF:Mama Zainab (Final).jpeg] "
            "holds a telephone handset to her ear. She smiles - warm, unhurried, utterly certain. "
            "Plaid green-and-yellow apron. Warm kitchen light. Shallow DOF. Anamorphic, photoreal. "
            "Dialogue (Egyptian Arabic, calm matriarchal authority): 'Tell them no. "
            "In this kitchen, we do it the village way, or not at all.' "
            "Audio: quiet warmth, her voice the only sound. " + NEGATIVE
        ),
    },
    {
        "number": "6.6", "sceneN": 6, "type": "wide", "dur": 4,
        "description": "Final shot: Wong hangs up, turns to the window, looks out at the peaceful Mediterranean sea. A smile. FADE OUT.",
        "dialogue": "",
        "cameraNotes": "Slow push toward silhouette. Peaceful sea beyond. Fade to black.",
        "prompt": (
            "Cinematic wide, 4 seconds. The silhouetted man hangs up a phone and slowly "
            "turns to face the floor-to-ceiling window. The camera begins a slow push toward "
            "him. Beyond the glass, the Mediterranean Sea at dusk - golden, peaceful, vast. "
            "He smiles. A warrior at rest. FADE TO BLACK. Anamorphic, photoreal, warm amber "
            "and deep teal. Audio: East-meets-Mediterranean fusion theme swells and fades. "
            + NEGATIVE
        ),
    },
]

def make_shot(s, idx):
    num = s["number"]
    shot_id = KEEP_IDS.get(num, uid())
    scene_id = SCENE[s["sceneN"]]
    return {
        "id": shot_id,
        "projectId": PROJECT_ID,
        "sceneId": scene_id,
        "number": num,
        "type": s["type"],
        "durationSec": s["dur"],
        "description": s["description"],
        "dialogue": s.get("dialogue", ""),
        "cameraNotes": s.get("cameraNotes", ""),
        "prompt": s["prompt"],
        "referenceUrls": [],
        "status": "prompted",
        "approvedTakeId": "",
        "sort": idx,
        "createdAt": NOW,
        "updatedAt": NOW,
    }

with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

new_shots = [make_shot(s, i) for i, s in enumerate(SHOTS)]
data["shots"] = new_shots

# Update takes to reference correct shot 1.1 id
for take in data.get("takes", []):
    if take.get("shotId") in [s["id"] for s in new_shots if s["number"] == "1.1"]:
        take["shotId"] = KEEP_IDS["1.1"]

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Done - wrote {len(new_shots)} shots to {DATA_PATH}")
for s in new_shots:
    print(f"  {s['number']:5}  {s['id']}  {s['type']:10}  {s['durationSec']}s  {s['description'][:55]}")
