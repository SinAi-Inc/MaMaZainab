# MaMa Zainab - Brand Awareness System

**Project:** Mama Zainab | **Owner:** SinAI Inc | **Date:** May 8, 2026  
**Status:** Phase 1 Complete - Bible & Schema Delivered

---

## The Problem

The Studio generated a **wrong character** for Mama Zainab - a generic modern woman instead of the authentic village Falaha - because there was **no structured brand data** feeding the prompt pipeline. The CHARACTER ANCHOR dropdown had no visual definitions, no prompt anchors, no guard rails.

**Root cause:** Zero connection between brand assets (characters, palette, pattern, packaging) and the generative AI pipeline.

---

## What Was Built

### Deliverables Created

| File | Purpose |
|------|---------|
| `Brand/brand-bible.json` | **The Bible** - single source of truth for all brand elements, characters, palette, patterns, typography, packaging, scene mapping, and prompt anchors |
| `Brand/studio-integration-schema.json` | **UI Contract** - defines how the Studio and Media Hub consume the Bible: dropdown bindings, prompt assembly pipeline, validation gates, video extensions, asset registry |
| `Brand/brand-awareness-roadmap.json` | **5-Phase Roadmap** - from foundation through Studio integration, validation, video pipeline, to full Media Hub distribution |

---

## System Architecture

```
L0: Brand Bible (brand-bible.json) ─── Single Source of Truth
 │
L1: Studio Integration Schema ──────── UI Contract
 │
L2: Generation Pipeline ────────────── Prompt Assembly + Model Dispatch
 │
L3: Validation Pipeline ────────────── Post-Gen Quality Gates
 │
L4: Media Hub DAM ──────────────────── Asset Management + Versioning
 │
L5: Distribution ───────────────────── Social, Print, Video, In-Store
```

**Data Flow:**  
`Bible → Studio UI → Prompt Assembly → Model (Flux/SDXL/Video) → Validation → Approved Asset → Media Hub → Distribution Channels`

---

## Brand Bible Contents

### Brand Identity

| Field | Value |
|-------|-------|
| **Name** | MaMa Zainab (ماما زينب) |
| **Tagline** | *"The Village Way, or Not at All"* |
| **Origin** | Named from the legendary Egyptian play "El Eyal Kebret" |
| **Personality** | Authentic, Warm, Village-Rooted, Nostalgic, Premium-Casual |
| **Market Position** | Fast-food Mahshi & Oriental home-food - village authenticity at scale |
| **Founding City** | Alexandria, Egypt |

---

### Color Palette

#### Primary Colors

| Name | Hex | RGB | Role |
|------|-----|-----|------|
| **Mahshi Green** | `#1B9B00` | 27, 155, 0 | Primary brand - grape leaves, village fields, core product |
| **Brand Yellow** | `#EFD200` | 239, 210, 0 | Warmth - golden rice, sunlight, Egyptian heritage |

#### Secondary Colors

| Name | Hex | RGB | Role |
|------|-----|-----|------|
| **Brand Red** | `#E60000` | 230, 0, 0 | Accent - spice, tomato sauce, energy |
| **Ink** | `#2C292A` | 44, 41, 42 | Primary text, deep contrast |
| **Cream** | `#FFF8E7` | 255, 248, 231 | Background - dough, village walls, comfort |

#### Extended Palette

| Name | Hex | Role |
|------|-----|------|
| Vine Dark | `#0D5E00` | Shadows, grape leaf interiors |
| Lemon Zest | `#FFF44F` | Highlight sparkle for food photography |
| Garlic White | `#FAFAFA` | Clean UI surfaces, kiosk screens |

**Prompt Anchor Block:**  
`[BRAND PALETTE] Mahshi Green #1B9B00 | Brand Yellow #EFD200 | Brand Red #E60000 | Ink #2C292A | Cream #FFF8E7`

---

### Signature Pattern - Plaid v2

| Field | Value |
|-------|-------|
| **Name** | Mama Zainab Plaid |
| **Structure** | Diamond/argyle weave - green lines on cream base, yellow cross-threads |
| **Colors** | `#1B9B00`, `#FFF8E7`, `#EFD200` |
| **Line Weight** | Medium (3–5px at 300dpi) |
| **Diamond Size** | ~40px repeat tile |
| **Usage** | Apron, packaging wraps, napkins, kiosk trim, social borders, video lower thirds |

**Prompt Anchor:**  
`Plaid v2: green-on-cream diamond weave with thin yellow cross-threads, rustic textile feel, not tartan - softer, village-handwoven aesthetic`

**Do NOT:** Use Scottish tartan, checkered gingham, or thick/neon lines.

---

### Typography

| Level | Family | Weights | Usage |
|-------|--------|---------|-------|
| **Display** | Bebas Neue | Regular | Headlines, scene titles, kiosk headers |
| **Body** | Poppins | Light–Bold | Body copy, menus, UI |
| **Secondary** | Montserrat | Light–Bold | Subtitles, secondary copy |
| **Script** | Lucida Handwriting | Italic | Mama's personal quotes, handwritten accents |
| **Cultural** | Chinese Monoline | Regular | Wong's dialogue cards |
| **Cultural** | KozGoPr6N | Regular | Chinese/Japanese subtitle overlays |

---

## Characters

### 1. Mama Zainab - `char_mama_zainab`

**Role:** Protagonist - the heart of the brand

| Trait | Detail |
|-------|--------|
| **Age** | 55–65 |
| **Build** | Medium, sturdy working woman |
| **Skin** | Olive-brown, sun-touched, Egyptian |
| **Face** | Round cheeks, deep smile lines, kind dark brown eyes |
| **Hijab** | Cream/beige, village-wrapped (Falaha style) - NOT modern fashion |
| **Hands** | Strong, flour-dusted |
| **Apron** | GREEN & YELLOW PLAID diamond weave (the signature brand element) |
| **Signature Line** | *"In this kitchen, we do it the village way, or not at all."* |

**Visual Prompt Anchor:**  
> Egyptian village woman (Falaha), late 50s-early 60s, kind warm face with deep smile lines, round cheeks, olive-brown skin, wearing a cream/beige hijab headscarf wrapped village-style, signature GREEN AND YELLOW PLAID APRON (diamond weave pattern, primary green #1B9B00 on cream #FFF8E7 with yellow #EFD200 cross-threads) over a simple dark green or cream dress. Hands are flour-dusted, strong working hands. Expression: warm, confident, motherly authority. NO modern makeup. NO fashion hijab styling. Village-authentic.

**DO NOT:**
- Make her look modern or urban
- Use fashion-forward hijab styling
- Show her without the plaid apron in brand contexts
- Make her skinny or model-like
- Give her Western features
- Show heavy makeup

**Reference Assets:** `MaMaZainabFinal.png`, `MaMa.jpeg`, `MaMaZainab.png`

---

### 2. Shang Hong Wong - `char_wong`

**Role:** Founder / Investor - the mysterious warrior-turned-empire-builder

| Trait | Detail |
|-------|--------|
| **Age** | 60–65 |
| **Ethnicity** | Chinese |
| **Build** | Lean, athletic - retired fighter |
| **Face** | Sharp features, subtle battle scars, piercing eyes, grey-white hair |
| **Expression** | Calm authority, dangerous calm |

**Three Visual Modes:**

| Mode | Wardrobe | Context |
|------|----------|---------|
| **Warrior** | Dark silken Chinese warrior robes (black/charcoal) | Scene 1 (rooftop), Scene 2 (pyramids) |
| **Business** | Premium minimalist linen suit (cream/light grey) | Scene 3 onwards |
| **Silhouette** | Dark outline against bright windows, backlit | Scene 6 - the "Banker" |

**Prompt Anchors:**

- **Warrior:** `Chinese man early 60s, lean battle-scarred, sharp eyes, grey-white hair, dark flowing silken warrior robes, dangerous calm, standing dramatically`
- **Business:** `Chinese man early 60s, lean dignified, sharp eyes, grey-white hair, premium cream linen suit, minimalist, understated luxury, calm authority`
- **Silhouette:** `Dark male silhouette against bright window, mysterious, only outline visible, backlit`

**DO NOT:**
- Make him comedic or cartoonish
- Show him cooking (he judges, not cooks)
- Remove battle-worn gravitas
- Make him look young or pretty-boy
- Show him in casual clothing

**Reference Assets:** `IsolatedWong.png`, `WongWarrior.jpg`, `WongHong.png`, `WongCollage.png`

---

### 3. ZuZu the Goose - `char_zuzu`

**Role:** Mascot / Sidekick - comedic, protective brand icon

| Trait | Detail |
|-------|--------|
| **Species** | White domestic goose (Embden-type) |
| **Color** | Pure white feathers, orange beak & feet |
| **Size** | Full-size goose, plump |
| **Accessory** | Small plaid ribbon matching apron pattern |
| **Actions** | Trips rivals, flaps flour clouds, honks warnings, thumbs-up wing, waddles beside Zainab |

**Prompt Anchor:**  
> Pure white plump domestic goose, orange beak, wearing small green-cream-yellow plaid ribbon, mischievous but lovable, waddling

**DO NOT:** Make it a duck/White Goose, make it aggressive, forget the ribbon, make it too small.

**Reference Assets:** `ZuZuThumbsUp.PNG`, `ZuZu.PNG`

---

### 4. Ghost of Mama Zainab - `char_ghost`

**Role:** Supernatural guide - visible only to Mama Zainab and ZuZu

| Trait | Detail |
|-------|--------|
| **Appearance** | Younger Mama Zainab (30s) |
| **Transparency** | Semi-transparent, ethereal glow |
| **Glow Color** | Green-gold luminescence (#1B9B00 + #EFD200) |
| **Dress** | Flowing white galabiya |

**Prompt Anchor:**  
> Semi-transparent ethereal young Egyptian woman 30s, glowing green-gold luminescence, flowing white galabiya, serene knowing expression

**DO NOT:** Make her horror/scary, make the glow blue/purple, show her as a different person from Mama Zainab.

**Reference Assets:** `ZainabSoul.png`, `ZainabSoul.jpg`

---

## Packaging Design

**System Rule:** All packaging uses Cream `#FFF8E7` as base, Plaid v2 accents, Mahshi Green `#1B9B00` as dominant.

| Item | Description | Asset |
|------|-------------|-------|
| **Food Box** | Cream base + green plaid band wrap, logo on lid | `box.jpeg` |
| **Can Holder** | Plaid pattern sleeve + logo stamp | `canholder.jpeg` |
| **Takeaway Column** | Tall branded container for stacked mahshi portions | `3amoudtakeaway.jpeg` |
| **Sauce Station** | Kiosk sauce panel with branded labels | `kiosksauces.jpeg` |

**Packaging Rules:**
1. Cream base - never pure white
2. Plaid as accent band/wrap - never full-cover
3. Logo placement: top-center or lid-center
4. Green `#1B9B00` dominant
5. No gradients - flat brand colors only
6. ZuZu may appear as small stamp/icon

---

## Scene-to-Brand Mapping

| Scene | Characters | Wong Mode | Palette Focus | Pattern | Mood |
|-------|-----------|-----------|---------------|---------|------|
| **1 - Neon Rooftop** | Wong | Warrior | Ink, Red | None | Dark, neon, rain, high-action |
| **2 - Pyramids** | Wong | Warrior | Cream, Green, Yellow | None | Epic, golden, vast, meditative |
| **3 - Competition** | Wong, Mama Zainab | Business | Green, Yellow, Cream | Aprons, banners | Bright, Mediterranean, festive |
| **4 - Cooking** | Mama Zainab, ZuZu, Ghost | - | Green, Yellow, Cream | Apron, ZuZu ribbon | Comedic, chaotic, warm |
| **5 - Judging** | Wong, Mama Zainab | Business | Green, Yellow | Apron | Dramatic, emotional, triumphant |
| **6 - Command Center** | All four | Silhouette | White, Green, Cream | Apron, subtle accents | Clean, futuristic, peaceful |

---

## Studio Integration Contract

### UI Bindings

**CHARACTER ANCHOR Dropdown** - 6 options, each auto-injects prompt anchor:

| Option | Injects | Also Injects | Preview Asset |
|--------|---------|--------------|---------------|
| MaMa Zainab | mama_zainab anchor | plaid_block | `MaMaZainabFinal.png` |
| Wong - Warrior | wong_warrior anchor | - | `WongWarrior.jpg` |
| Wong - Business | wong_business anchor | - | `IsolatedWong.png` |
| Wong - Silhouette | wong_silhouette anchor | - | `WongHong.png` |
| ZuZu the Goose | zuzu anchor | plaid_block | `ZuZuThumbsUp.PNG` |
| Ghost of Mama Zainab | ghost anchor | - | `ZainabSoul.png` |

**SCENE CONTEXT Dropdown** - auto-configures palette, characters, mood, pattern:

Scene 1–6 + Marketing General, Packaging Shot, Menu Item Hero

**Palette Checkbox** - "Append brand palette & plaid context": auto-prepends palette block and injects plaid if character wears apron.

### Prompt Assembly Pipeline (6-Step Order)

```
1. Scene Context (mood + palette_focus)   ← if scene selected
2. Character Anchor                        ← from dropdown
3. User Prompt                             ← free-text creative input
4. Palette Block                           ← if checkbox enabled
5. Plaid Block                             ← if character has apron/ribbon OR packaging
6. Negative Prompt                         ← auto-injected do_not rules
```

**Assembled Template:**  
`[SCENE: {mood}] {character_anchor}. {user_prompt}. [BRAND PALETTE] {palette_block}. [PATTERN] {plaid_block}. --no {negative_prompt_list}`

---

## Validation Pipeline

### Pre-Generation Checks

| Check | Action |
|-------|--------|
| Character matches scene | Warn if Wong=Warrior but scene is 3–6 |
| Palette enabled | Warn if palette off for marketing/packaging context |

### Post-Generation Quality Gates

| Gate | Method | Threshold | Failure Flag |
|------|--------|-----------|-------------|
| **Color Compliance** | Extract top-5 colors → compare to palette | 80% brand-palette area | "Off-Brand" |
| **Face Consistency** | Face embedding vs. reference assets | cosine_similarity > 0.75 | "Character Mismatch" |
| **Apron Presence** | Object detection for plaid apron (Mama Zainab) | detected/not | "Missing Brand Element" |
| **Pattern Classifier** | Texture classification on plaid regions | diamond_weave only | "Wrong Pattern" |

---

## Video Generation Extensions

### Scene Transitions

| Transition | Style |
|-----------|-------|
| Scene 1 → 2 | Hard cut to white → fade in on pyramids |
| Scene 2 → 3 | Cut to black → "MONTHS LATER" title card → Alexandria wide shot |
| Scene 5 → 6 | Golden bell sound → dissolve to command center |

### Lower Thirds

- **Font:** Bebas Neue
- **Background:** Plaid v2 pattern strip
- **Text Color:** `#2C292A`
- **Accent:** `#1B9B00`

### Voice Direction

| Character | Direction |
|-----------|-----------|
| Wong (Scenes 1–2) | Chinese language, Arabic subtitles |
| Wong (Scene 3+) | Broken Egyptian accent in Arabic |
| Mama Zainab | Authentic Egyptian village dialect |
| ChatGPT V.O. | Crisp, analytical AI voice |

---

## Asset Registry (Media Hub DAM)

### Characters (`Charcters/`)

| File | Type | Character | Usage |
|------|------|-----------|-------|
| `MaMaZainabFinal.png` | Character Sheet | Mama Zainab | Reference, Prompt Preview |
| `MaMa.jpeg` | Portrait | Mama Zainab | Social, Reference |
| `IsolatedWong.png` | Isolated Cutout | Wong | Compositing, Reference |
| `WongWarrior.jpg` | Scene Reference | Wong (Warrior) | Reference |
| `WongHong.png` | Character Sheet | Wong | Reference, Prompt Preview |
| `WongCollage.png` | Mood Board | Wong | Reference |
| `ZuZuThumbsUp.PNG` | Mascot Pose | ZuZu | Social, Sticker, Reference |
| `ZuZu.PNG` | Portrait | ZuZu | Reference |
| `ZainabSoul.png` | Character Sheet | Ghost | Reference, VFX Base |
| `SceneOne.png` | Scene Reference | Scene 1 | Storyboard, Reference |

### Brand Design (`Brand/`)

| File | Type | Usage |
|------|------|-------|
| `Apron.png` | Product Mockup | Reference, Pattern Source |
| `Kiosk.png` | Environment Mockup | Reference, Location Guide |

### Packaging (`Charcters/`)

| File | Type | Usage |
|------|------|-------|
| `box.jpeg` | Food Box Mockup | Reference, Product Shot |
| `canholder.jpeg` | Can Holder Mockup | Reference, Product Shot |
| `3amoudtakeaway.jpeg` | Takeaway Column | Reference, Product Shot |
| `kiosksauces.jpeg` | Sauce Station | Reference |

### Legacy Guidelines (`Phase 01-Legacy/`)

| File | Type | Usage |
|------|------|-------|
| `Mama Zainab Brand_guideline.ai` | Source Vector | Print, Design |
| `Mama Zainab Brand_guideline.pdf` | Guideline Doc | Reference |
| `Mama Zainab Final version.ai` | Source Vector | Print, Design |

### Fonts (`fonts/`)

| File | Usage |
|------|-------|
| `Chinese Monoline.ttf` | Wong's dialogue, cultural accent |
| `KozGoPr6N-Regular.otf` | Subtitle overlays |
| `LHANDW.TTF` | Handwritten quotes, Mama's voice |

---

## Roadmap - 5 Phases

### Phase 1: Brand Bible & Schema Foundation - ✅ COMPLETE

- `brand-bible.json` - full character definitions, palette, pattern, typography, packaging, scene mapping, prompt anchors, generation rules
- `studio-integration-schema.json` - UI binding contract, prompt assembly pipeline, validation pipeline, video extensions, asset registry

### Phase 2: Studio UI Integration - NEXT

| Task | Detail |
|------|--------|
| 2.1 | Wire CHARACTER ANCHOR dropdown to brand-bible.json character entries |
| 2.2 | Add SCENE CONTEXT dropdown per integration schema |
| 2.3 | Implement 6-step prompt assembly pipeline |
| 2.4 | Add character reference image preview panel |
| 2.5 | Implement palette & plaid auto-injection checkbox logic |

### Phase 3: Post-Generation Validation - PLANNED

| Task | Detail |
|------|--------|
| 3.1 | Color compliance checker (dominant colors vs. brand palette) |
| 3.2 | Character face consistency (embedding comparison) |
| 3.3 | Brand element detection (apron, ribbon, packaging pattern) |
| 3.4 | Pattern classifier (diamond weave vs. tartan/gingham) |

### Phase 4: Video Generation Pipeline - PLANNED

| Task | Detail |
|------|--------|
| 4.1 | Scene-to-video workflow (script → storyboard → animate) |
| 4.2 | Character consistency across frames (IP-Adapter / ControlNet) |
| 4.3 | Auto-generate branded lower thirds & title cards |
| 4.4 | Pre-built scene transition templates |

### Phase 5: Media Hub & Distribution - PLANNED

| Task | Detail |
|------|--------|
| 5.1 | DAM integration - auto-catalog with tags & compliance scores |
| 5.2 | Social media templates (1:1, 9:16, 16:9, 2:1) with brand frames |
| 5.3 | Print-ready export (CMYK + bleed guides) |
| 5.4 | Brand consistency dashboard - compliance tracking over time |

---

## Immediate Next Steps

1. **Feed `brand-bible.json` into the Studio backend** as the `/brand/*` API endpoint
2. **Update CHARACTER ANCHOR dropdown** to consume character entries with asset previews
3. **Implement prompt assembly pipeline** (Phase 2.3) - this alone would have prevented the failed generation
4. **Add reference image preview panel** so operators can visually verify before distributing

---

## Generation Rules - Mandatory

- ALWAYS inject `palette_block` when "Append brand palette" is enabled
- ALWAYS inject the correct `character_anchor` when a CHARACTER ANCHOR is selected
- ALWAYS inject `plaid_block` when character wears apron or packaging is shown
- NEVER generate Mama Zainab without the plaid apron in brand/marketing contexts
- NEVER generate Wong cooking - he is the investor, not the cook
- NEVER use blue, purple, or pink as dominant colors - they are off-brand
- ALWAYS match Wong's wardrobe mode to the scene context
- ZuZu must always have the plaid ribbon accessory

---

## API Endpoint Specification

| Endpoint | Returns |
|----------|---------|
| `GET /brand/palette` | Color palette object |
| `GET /brand/characters` | All character definitions with prompt anchors |
| `GET /brand/characters/{id}` | Single character with full visual prompt anchor |
| `GET /brand/pattern` | Plaid pattern definition and prompt anchor |
| `GET /brand/prompt-anchors` | All pre-built prompt fragments |
| `GET /brand/scene/{scene_id}` | Scene-specific brand requirements |
| `GET /brand/packaging` | Packaging design rules and asset refs |
| `GET /brand/rules` | Generation rules for validation pipeline |
| `GET /brand/typography` | Typography system |
| `GET /brand/full` | Complete bible |

---

*This document is the human-readable companion to the machine-readable `brand-bible.json` and `studio-integration-schema.json`. Together they form the complete Brand Awareness System foundation.*
