# MaMa Zainab - Brand System (v2026.05.0)

> **Authentic Mahshi. Homemade Taste. Fast-Food Speed.**
> طعم البيت، بسرعة الوجبات السريعة.

Single source of truth for the brand. All UI, packaging, signage, video, and marketing must conform to this document. Tokens live in [tokens.json](tokens.json).

---

## 1. Identity

| Field | Value |
|---|---|
| Brand name (locked) | **MaMa Zainab** *(camel-case styling)* |
| Arabic | ماما زينب |
| Chinese (founder lore) | 盛恒王 (Shang Hong Wong) |
| Category | Oriental fast-food chain - specialized in Mahshi (stuffed grape leaves & vegetables) |
| Promise | Authentic Egyptian homemade food, served at fast-food speed |
| Launch city | Alexandria, Egypt |
| Y1 goal | 100 branches in Alexandria, then Cairo, then regional |
| Domains | mamazainab.com · mamazainab.netlify.app (current) |
| Contact | hello@mamazainab.com |

### Spelling rules (HARD LOCK)
- ✅ **MaMa Zainab** - only correct form
- ❌ MAMA ZAYNAB, MAMA ZEINAB, Mama Zeinab, Mamma, Mamazainab - all rejected
- All legacy assets in `F:\` are reference-only and will be corrected as we re-issue.

---

## 2. Logo

**Status: NOT FINAL.** Only the wordmark text and font are locked.

- **Wordmark:** `MaMa Zainab` set in **Chinese Monoline**.
- **Mark / illustration:** TBD (do not commit any of the three legacy logos to production).
- Arabic and Chinese lockups must be designed alongside the final mark.
- Clear space: 1× cap-height of the "M" on all sides.

**Misuse (per guideline p.14):** no rotation, distortion, color change, typeface change, repositioning, effects, outlines, or lightening.

---

## 3. Color

Source: brand-guideline PDF p.9.

### Primary palette (locked HEX)

| Token | HEX | RGB | CMYK | Role |
|---|---|---|---|---|
| `brand.green` | **#1B9B00** | 27,155,0 | 83,13,100,2 | **PRIMARY (base)** - vine leaves, freshness |
| `brand.yellow` | **#EFD200** | 239,210,0 | 8,12,100,0 | **SECONDARY (accent)** - warmth, generosity |
| `brand.black` | #000000 | 0,0,0 | 75,68,67,90 | Strength, body text |
| `brand.white` | #FFFFFF | 255,255,255 | 0,0,0,0 | Surface |

### Extended palette (sampled from guideline + creative)

| Token | HEX | Role |
|---|---|---|
| `extended.greenDeep` | #169216 | Hover / dark green variant |
| `extended.cream` | #F0F4EB | Warm off-white surface |
| `extended.alertRed` | #E60000 | "STOP" disruption campaign only |
| `extended.ink` | #2C292A | Softer body text |
| `extended.mutedGrey` | #B7B7B7 | Dividers / disabled |

### ⚠️ Plaid pattern flip (this release)

- **Old:** yellow apron base + green stripes (legacy character art)
- **New (locked):** **green base + yellow stripes + white weft**
- Affects: apron redesign, packaging side panels, kiosk awning, web hero accents, app onboarding screens.
- Ratio: 16 px unit · base 5 · stripe 2 · weft 1.
- Colors do **not** change - only the dominance flips.

---

## 4. Typography

| Role | Family | Source | Notes |
|---|---|---|---|
| Display / logo | **Chinese Monoline** | [`fonts/Chinese Monoline.ttf`](../fonts/Chinese%20Monoline.ttf) | Logo & hero only |
| Headline | **Bebas Neue** | Adobe Fonts (license) | Posters, section heads |
| Body / UI | **Poppins** (Light/Regular/Medium/SemiBold/Bold) | Adobe Fonts → Google Fonts fallback | Web, app, print body |
| Arabic | **Cairo** (or Tajawal) | Google Fonts (open-source) | RTL pairing |
| CJK | **Kozuka Gothic Pr6N** / Noto Sans JP | [`fonts/KozGoPr6N-Regular.otf`](../fonts/KozGoPr6N-Regular.otf) | 盛恒王 lockup |
| Script | Lucida Handwriting | [`fonts/LHANDW.TTF`](../fonts/LHANDW.TTF) | Sparing, hand-signed accents |

**Action item:** procure Adobe Fonts licenses for Bebas Neue + Poppins, OR switch project-wide to Google Fonts equivalents (Bebas Neue is also on Google Fonts; Poppins is native there).

Type scale lives in [tokens.json](tokens.json#L52) (`typography.scale`).

---

## 5. Voice & Tone

| Dimension | Voice |
|---|---|
| Personality | Warm Egyptian mother × silent disciplined warrior × playful goose mascot |
| Tone | Confident, nostalgic, witty, never corporate |
| Languages | Arabic (Egyptian colloquial first), English, Chinese (lore/cinematic only) |
| Reading level | Conversational; menu copy at 6th-grade level |
| Anti-positioning | Permitted ("we are NOT just dolma" - see `Stop.jpeg`/`stop003.jpeg` creative) |

### Tagline library
- **Pitch master:** *Authentic Mahshi. Homemade Taste. Fast-Food Speed.*
- **Headline:** *The taste of home, served at fast-food speed.*
- **Brand book:** *Tradition rolled with love.*
- **Arabic master:** «طعم البيت، بسرعة الوجبات السريعة.»

---

## 6. Iconography & Cast

| Asset | Role | Reference |
|---|---|---|
| **Mama Zainab** | Brand face - village matriarch, plaid apron | [Charcters/Mama Zainab (Final).jpeg](../Charcters/Mama%20Zainab%20%28Final%29.jpeg) |
| **ZuZu** | Mascot - white goose, plaid ribbon, comic sidekick | [Charcters/ZuZu.JPEG](../Charcters/ZuZu.JPEG) |
| **Shang Hong Wong** | Founder lore - silent investor / "the Banker" | [Charcters/WongHong.png](../Charcters/WongHong.png) |
| **Ghost of Zainab** | Mystical comic element (video only) | TBD |
| **Traffic-light kiosk topper** | Architectural icon for stores | F:\ kiosk concepts |

---

## 7. Pattern System

- **Plaid** (see §3 - green base, yellow + white stripes) → primary brand pattern.
- **Food iconography** (mahshi roll, leaf, cutlery, goose silhouette) → secondary pattern, line-art only.
- **Geometric grid** (4 px base) → underlying layout grid for web/app.

---

## 8. Application Quick-Reference

| Surface | Base color | Accent | Pattern density |
|---|---|---|---|
| Kiosk facade | green | yellow + white plaid awning | high |
| Takeaway box | green | yellow lid band | medium |
| Sauce cup | white | green ring + yellow lid | low |
| Website hero | cream | green CTA + yellow underline | low (texture only) |
| App onboarding | green | yellow CTA, white card | medium |
| Social ads | white | red ("STOP") OR green (story) | varies |
| Vehicle wrap | green | yellow stripe + ZuZu | high |

---

## 9. Open Decisions (route to founder)

1. **Final logo mark** - 3 directions to be presented next round (modern type-only, illustrated badge with ZuZu, Eastern-stamp/seal).
2. **Plaid scale** for apron vs. packaging vs. signage - design test needed.
3. **Adobe Fonts vs. Google Fonts** - licensing decision.
4. **Halal certification mark** placement on packaging (mentioned in pitch deck).
5. **Trademark** registration for "MaMa Zainab" wordmark (legal docs in `F:\Official\` to be reviewed for current entity name).

---

## 10. Source Materials

- Brand book PDF: `F:\H.Q\SinAI Inc\R&D Docs\Mama Zainab\BrandGuidelines\Mama Zainab Brand_guideline.pdf` (22 pages)
- Pitch deck: `F:\...\BrandGuidelines\mamazienab.pptx` (10 slides, bilingual)
- Vector source: `F:\...\Mama Zainab Brand_guideline.ai`
- Reference video: `F:\...\Archive\WhatsApp Video 2026-05-02 at 1.58.24 PM.mp4`
- Extracted assets: [`_extract/`](../_extract/) (PDF pages → PNG, video frames, palette JSON, PPTX text)
- Script: [Scripts/MaMa Zainab.md](../Scripts/MaMa%20Zainab.md)
