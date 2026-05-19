# MaMa Zainab - Storyboard & AI Video Prompt Pack v1
**Source script:** [Scripts/MaMa Zainab.md](../Scripts/MaMa%20Zainab.md)
**Brand lock:** [01_Brand/BRAND.md](../01_Brand/BRAND.md) · [tokens.json](../01_Brand/tokens.json)
**Target runtime:** ~3:30 cinematic master + 6 social cuts (15s, 30s, 60s)

---

## 0. Production stack (recommended)

| Layer | Primary | Backup | Why |
|---|---|---|---|
| Cinematic 1080p shots | **Google Veo 3.1** (audio-native) | Runway Gen-4, Kling 2.5 Pro | Best motion + sound design |
| Character consistency | **Higgsfield Soul / Kling Character Ref** + custom LoRA | Midjourney `--cref` | Wong, Zainab, ZuZu must look identical scene-to-scene |
| Lip-sync (AR + ZH) | **Hedra Character-3** | HeyGen | Multi-language phoneme accuracy |
| Voice | **ElevenLabs v3 Multilingual** | OpenAI TTS, PlayHT | Wong (Mandarin), Zainab (Egyptian AR), ChatGPT V.O. (neutral EN-AR mix) |
| Keyframes / posters | **Midjourney v7** + Flux 1.1 Pro Ultra | Recraft v3 | Style-locked stills |
| Upscale | **Topaz Video AI** | Magnific | 1080p → 4K |
| Edit / grade | **DaVinci Resolve** | Premiere + Lumetri | Cinematic LUT |
| Sound design | **ElevenLabs SFX** + **Suno v4** score | Udio | East-meets-Mediterranean OST |

### Character reference anchors (bake into every prompt)
- **SHANG HONG WONG** → seed image: [Charcters/WongHong.png](../Charcters/WongHong.png) · 60s East-Asian male, weathered, silver streaks, dark silken warrior robes, calm eyes.
- **MAMA ZAINAB** → seed: [Charcters/Mama Zainab (Final).jpeg](../Charcters/Mama%20Zainab%20%28Final%29.jpeg) · 50–60s Egyptian woman, warm face, headscarf, **green-base plaid apron with yellow stripes** (PLAID v2 - see [01_Brand/plaid_v2/](../01_Brand/plaid_v2/)).
- **ZUZU (the goose)** → seed: [Charcters/ZuZu.JPEG](../Charcters/ZuZu.JPEG) · plump white goose, plaid ribbon (matching apron), curious orange beak, expressive eyes.
- **GHOST OF ZAINAB** → translucent younger version of Zainab, pale luminous green tint (#1B9B00 @ 30% glow), wind-blown.

### Global style suffix (append to every shot prompt)
```
shot on ARRI Alexa 35, anamorphic 2.39:1, cinematic color grade,
warm Mediterranean highlights + cool teal shadows,
volumetric haze, photoreal, film grain, no text overlay
```

---

## SCENE 1 - Neon City Rooftop (NIGHT, action / setup)

### Shot list
| # | Type | Duration | Description |
|---|---|---|---|
| 1.1 | Aerial wide | 4s | Slow descent through neon-soaked Hong-Kong-style cityscape, rain catching pink/cyan signs |
| 1.2 | Low angle hero | 3s | Wong silhouetted at skyscraper edge, wind whipping his coat |
| 1.3 | Insert | 2s | His scarred hands turning over, blood rinsing in the rain |
| 1.4 | OTS phone | 4s | Glass-morphic smartphone glowing, ChatGPT interface |
| 1.5 | Reverse low | 3s | Mob bursting through the rooftop door behind him |
| 1.6 | Match-cut leap | 3s | Wong dives backward off the roof, neon dissolves to white |

### Veo 3 prompt - Shot 1.1
```
Establishing aerial shot, 4 seconds. Cinematic dystopian city at night, torrential
rain in slow motion, dense forest of skyscrapers covered in pink, cyan and magenta
neon Chinese signage. Camera descends slowly between the towers toward a single
illuminated rooftop. Wet reflective streets below. Volumetric fog. Blade Runner
2049 mood. Anamorphic 2.39:1. ARRI Alexa 35, no text or logos visible.
Audio: distant thunder, rain, low synth drone.
```

### Veo 3 prompt - Shot 1.2 (CHARACTER LOCK)
```
Cinematic medium-wide, 3 seconds. East-Asian man in his 60s [REF:WongHong.png],
silver-streaked hair, weathered face, wearing dark silken warrior robes that
billow in heavy wind and rain, standing at the edge of a rain-soaked skyscraper
rooftop, neon city glowing far below, back three-quarters to camera, looking
down at his own hands. Slow push-in. Anamorphic, shallow depth of field,
photoreal, film grain. Audio: rain, wind, faint heartbeat.
```

### Veo 3 prompt - Shot 1.4 (phone insert + dialogue)
```
Macro insert, 4 seconds. A weathered hand holds a sleek glass-morphic smartphone
in pouring rain, water beads on the screen. Floating holographic ChatGPT
interface glows softly. Slow rack focus from raindrops to the screen.
Anamorphic, shallow DOF, neon reflections in droplets, photoreal.
Dialogue (Mandarin Chinese, weary male voice, ~60yo): "我厌倦了战争。告诉我...
地球上哪里没有人会来找战士，而食物可以治愈破碎的灵魂？"
Subtitle (Arabic, on-screen lower-third - DO NOT generate; add in post).
```

### Hedra lip-sync brief (Wong)
- **Voice:** ElevenLabs v3 - clone or "Wise Asian Elder" preset, lower the pitch 5%, weariness +30%.
- **Language:** Mandarin (zh-CN), with Egyptian-Arabic burned-in subtitles in post.
- **Emotion:** quiet exhaustion.

---

## SCENE 2 - Pyramid Apex (DAY, meditation / strategy)

### Shot list
| # | Type | Duration | Description |
|---|---|---|---|
| 2.1 | Drone 360° wide | 6s | Sweeping orbit around Wong meditating on the apex of the Great Pyramid |
| 2.2 | Medium hero | 3s | Wong opens his eyes, raises the phone |
| 2.3 | OTS phone | 4s | ChatGPT analysis HUD overlay (Egyptian market sentiment graph) |
| 2.4 | Close-up | 2s | Wong's small dangerous smile |
| 2.5 | Wide back | 3s | Robes billow against blue sky, looking north |
| 2.6 | High angle dive | 4s | Wong steps off, dives - disappears in dust devil |

### Veo 3 prompt - Shot 2.1 (HERO)
```
Cinematic drone orbit, 6 seconds, 360-degree slow circle around the apex of the
Great Pyramid of Giza at high noon. Vast Giza desert and distant Cairo skyline
shimmer in heat haze. Seated cross-legged on the weathered limestone summit:
East-Asian man in his 60s [REF:WongHong.png], silver-streaked hair, dark silken
warrior robes rippling in the desert wind, eyes closed in deep meditation,
perfectly still. Long shadow. Anamorphic 2.39:1, ARRI Alexa 35, photoreal,
warm desert highlights, deep teal sky. Audio: low wind, distant hawk cry, sparse
ney flute drone.
```

### Veo 3 prompt - Shot 2.3 (HUD insert)
```
Tight over-shoulder, 4 seconds. Same warrior holding a glass-morphic smartphone
above the limestone of the pyramid. Translucent holographic UI floats above the
screen showing Arabic-language data charts, Egyptian map with pulsing dot on
Alexandria, and dish illustrations (mahshi, mombar, macaroni bechamel).
Sun-drenched, warm rim light, depth of field shallow. Photoreal. No readable
brand text. Audio: quiet electronic AI tone, soft chime.
```

### Voice direction - ChatGPT V.O.
ElevenLabs v3, female-leaning neutral, calm-analytical, **English** (Wong's Mandarin gets Arabic subs in post). Add subtle digital reverb tail.

---

## SCENE 3 - Alexandria Plaza (DAY, the casting call)

### Shot list
| # | Type | Duration | Description |
|---|---|---|---|
| 3.1 | Drone reveal | 4s | Mediterranean coastline, then giant stage with hundreds of cooking stations |
| 3.2 | Hero medium | 3s | Wong (now in cream linen suit) at judging table, microphone |
| 3.3 | Sweep tracking | 4s | Camera glides past dozens of women in colorful aprons rolling grape leaves |
| 3.4 | Crowd reaction | 2s | Excited Alexandria crowd in the bleachers |

### Veo 3 prompt - Shot 3.1
```
Sweeping drone shot, 4 seconds. Coastal Alexandria, Egypt at golden hour, the
Mediterranean sparkling. Camera flies over the iconic corniche then reveals a
massive open-air food competition stage in a grand plaza: dozens of stainless
steel cooking stations arranged in rows, each manned by a woman cook, large
crowd cheering. Volumetric sun rays, lens flare, anamorphic, photoreal,
warm sunset palette. Audio: cheering crowd, oud + light percussion.
```

### Veo 3 prompt - Shot 3.2 (Wong reborn)
```
Cinematic medium, 3 seconds. The same East-Asian man [REF:WongHong.png] now
transformed - clean-shaven, hair tied back, wearing a premium minimalist
cream-linen suit, standing behind a long judging table, holding a vintage
brass microphone. Background: rows of cooks bokeh'd out. Calm authority.
Anamorphic, soft golden-hour key light, photoreal.
Dialogue (English with thick Mandarin accent, broken Egyptian Arabic mix):
"I have traveled across the world to find the perfect roll. The one who
creates the ultimate Sobah Mahshi wins my life's fortune. You will be...
our MaMa Zainab. Begin!"
```

---

## SCENE 4 - Comedic Sabotage Sequence

### Shot list (rapid-cut comedy montage)
| # | Type | Duration | Description |
|---|---|---|---|
| 4.1 | Medium 2-shot | 3s | Mama Zainab + ZuZu the goose at her station, calm precision |
| 4.2 | VFX shimmer | 2s | Ghost of Zainab fades into existence beside her |
| 4.3 | Quick cut | 1.5s | Rival chef reaches for salt - ZuZu trips her - sugar dumps into pot |
| 4.4 | Quick cut | 1.5s | Mob saboteur in apron approaches - Ghost blows ice wind - hands freeze to pot |
| 4.5 | Quick cut | 1.5s | ZuZu flaps wings - flour cloud blinds three rivals mid-plate |
| 4.6 | Reset | 2s | Mama Zainab quietly plates one perfect emerald-green mahshi finger |

### Veo 3 prompt - Shot 4.1 (CAST LOCK)
```
Cinematic medium two-shot, 3 seconds. An Egyptian woman in her 50s
[REF:Mama Zainab (Final).jpeg], warm kind face, headscarf, wearing a GREEN-base
plaid apron with yellow stripes and white weft (woven texture), hand-rolling a
grape leaf with calm precision at a stainless cooking station. Beside her: a
plump white goose [REF:ZuZu.JPEG] wearing a tiny matching plaid ribbon, alert
and proud. Sunlit outdoor stage, shallow DOF, anamorphic, photoreal, warm
golden-hour light. Audio: ambient crowd, soft kitchen clink, comic flute motif.
```

### Veo 3 prompt - Shot 4.2 (ghost FX)
```
Cinematic medium, 2 seconds. A pale luminous-green translucent younger version
of the same Egyptian woman shimmers into existence beside Mama Zainab, like
heat haze made visible, edges glowing soft #1B9B00 green. Only Mama Zainab and
the white goose can see her. Photoreal compositing, anamorphic, gentle wind
particles. Audio: soft chime, low hum.
```

### Veo 3 prompt - Shot 4.3 (sight-gag)
```
Quick comedic insert, 1.5 seconds. A high-end chef in pristine white reaches
across her station for a salt jar; a plump white goose [REF:ZuZu.JPEG] darts
between her ankles and trips her; she stumbles forward, accidentally upending
a giant paper bag of sugar into a bubbling cooking pot. Slapstick timing.
Cinematic anamorphic, photoreal, comedy beat, sound effect: cartoon "boing"
+ pour.
```

---

## SCENE 5 - Judging Table (the moment)

### Shot list
| # | Type | Duration | Description |
|---|---|---|---|
| 5.1 | Top-down | 2s | Single emerald-green mahshi finger on white plate before Wong |
| 5.2 | Close-up | 3s | Wong picks it up, takes a bite |
| 5.3 | VFX flavor explosion | 4s | Vision flash: green fields, warm village kitchen, mother's hands |
| 5.4 | Hero medium | 3s | Wong's eyes meet Zainab's; he says "The war is finally over." |
| 5.5 | Wide | 3s | He rings massive golden bell; crowd erupts; confetti |

### Veo 3 prompt - Shot 5.3 (flavor explosion)
```
Cinematic VFX montage, 4 seconds. From inside a man's closed eyes: rapid dream
flashes - sunlit Egyptian village green fields rolling in wind, an old stone
oven glowing orange, a mother's flour-dusted hands rolling grape leaves on a
wooden table, steam rising from a copper pot, a sun-bleached blue door. Each
image dissolves into the next on warm light flares. Anamorphic, photoreal,
nostalgic film-grain, golden hour. Audio: swelling strings + ney flute, soft
heartbeat.
```

---

## SCENE 6 - Command Center (epilogue)

### Shot list
| # | Type | Duration | Description |
|---|---|---|---|
| 6.1 | Wide reveal | 4s | Apple-store-clean office above Alexandria harbor, holographic menus |
| 6.2 | Medium | 3s | Mama Zainab in plaid apron in the corner kitchen, feeding ZuZu bread |
| 6.3 | Insert | 2s | Red phone rings on a glass desk |
| 6.4 | Intercut | 4s | Wong silhouette in penthouse - "London wants more garlic" |
| 6.5 | Hero close | 3s | Zainab smiling: "Tell them no. Village way, or not at all." |
| 6.6 | Final wide | 4s | Wong smiles, hangs up, looks at peaceful Mediterranean. FADE OUT. |

### Veo 3 prompt - Shot 6.1
```
Cinematic wide establishing, 4 seconds. Minimalist Apple-store-clean executive
office, floor-to-ceiling windows overlooking Alexandria harbor at sunset.
Floating translucent holographic menus and growth charts hover above glass
desks. Brand color accents: #1B9B00 green and #EFD200 yellow on UI panels.
Slow dolly forward. Anamorphic, photoreal, warm sunset rim light. No readable
text on holograms.
```

### Veo 3 prompt - Shot 6.2 (CAST)
```
Cinematic medium, 3 seconds. Same Egyptian woman [REF:Mama Zainab (Final).jpeg]
in green-base plaid apron with yellow stripes, laughing softly as she feeds a
piece of bread to a plump white goose [REF:ZuZu.JPEG]. Sun-drenched corner
kitchen. On the windowsill behind her, barely visible, a faint translucent
green-glowing female figure sits peacefully (Ghost of Zainab). Anamorphic,
shallow DOF, golden hour, photoreal. Audio: gentle laughter, distant gull.
```

---

## Negative-prompt block (use everywhere)
```
no logos, no readable text, no modern brand signage, no warped faces,
no extra fingers, no duplicated characters, no plastic skin, no AI artifact
shimmer, no cartoon style, no anime, no watermark, no over-saturation
```

---

## Voice cast direction (ElevenLabs v3)

| Character | Voice profile | Language | Emotion notes |
|---|---|---|---|
| Shang Hong Wong | Wise Asian Elder, lower pitch 5%, gravel +20% | Mandarin (Scenes 1–2), broken English w/ MD accent (Scenes 3+) | Weary → tactical → reborn calm |
| ChatGPT V.O. | Neutral mid-range, slight digital reverb tail (~80ms) | English | Crisp, analytical, never warm |
| Mama Zainab | Warm 50s Egyptian woman, low chest voice | Egyptian colloquial Arabic | Calm, matriarchal, dry humor |
| Crowd / SFX | ElevenLabs SFX | n/a | Plaza ambience, applause, kitchen |

## Score brief (Suno v4 / Udio)
- **Theme A** (Wong's journey): pentatonic erhu + sub-bass + rain perc, 60 BPM, dystopian → resolves into…
- **Theme B** (MaMa Zainab): Egyptian ney + qanun + warm strings, 84 BPM, nostalgic, Mediterranean.
- **Sting** (sabotage scene): muted brass stabs + cartoon woodblock.
- **Outro**: Theme A + B braided in a single melody (East × Egypt fusion).

---

## Social cut-down map

| Cut | Length | Source shots | Hook |
|---|---|---|---|
| TikTok / Reels A | 15s | 1.4 → 2.3 → 3.2 → 5.4 | "He asked an AI where to start over…" |
| TikTok / Reels B | 15s | 4.1 → 4.3 → 4.4 → 4.5 → 5.5 | The goose-and-ghost sabotage compilation |
| YouTube preroll | 30s | 1.6 → 2.6 → 3.2 → 5.4 | Mythic launch teaser |
| In-store loop | 60s | 3.1 → 4.1 → 5.1 → 5.5 → 6.2 | No-dialogue food-porn loop |
| Cinema spot | 60s | 1.1 → 1.4 → 2.1 → 3.2 → 5.3 → 5.4 | Premium brand film |
| Hero film | 3:30 | All scenes | Master |

---

## Production order (suggested)
1. **Lock cast LoRAs** (Wong, Zainab, ZuZu, Ghost) - 1 day in Higgsfield/Kling.
2. **Render Scene 4** first (highest comedy/character risk) → validates consistency.
3. Then Scenes 5, 6 (controlled environments).
4. Then Scenes 1, 2 (hero VFX-heavy).
5. Scene 3 last (largest crowd, most expensive renders).
6. Voice + lip-sync pass → grade → score → final mix.
