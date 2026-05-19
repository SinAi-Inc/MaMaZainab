# Brand Audit - MaMa Zainab (2026-05-03)

## Sources reviewed
- ✅ Brand-guideline PDF (22 pages, rendered to PNG + text)
- ✅ Pitch deck PPTX (10 bilingual slides)
- ✅ Reference video MP4 (12 keyframes extracted)
- ✅ All character art in workspace + F:\ source folder
- ✅ All packaging mockups (boxes, bags, cups, kiosk concepts)
- ⏭️ Legal docs in `F:\Official\` - skipped per founder direction (name locked manually)

## Findings

### ✅ Locked
| Item | Decision |
|---|---|
| Brand name spelling | **MaMa Zainab** (camelCase) |
| Logo wordmark font | Chinese Monoline |
| Primary HEX | #1B9B00 green / #EFD200 yellow / #000000 / #FFFFFF |
| Typography stack | Chinese Monoline + Bebas Neue + Poppins |
| Positioning | Authentic Mahshi, fast-food speed, Alexandria → 100 branches Y1 |

### 🔄 Changed this release
| Item | Before | After |
|---|---|---|
| Plaid base color | Yellow (legacy apron) | **Green** (per founder direction) |
| Folder name | `Charcters/` (typo) | Will rename to `02_Characters/` in restructure |
| Brand-name spelling drift | Zaynab/Zeinab/Zainab in legacy assets | Single canonical: MaMa Zainab |

### ⚠️ Open decisions
1. Final logo mark (3 directions to design)
2. Plaid scale per surface (apron vs. packaging vs. signage)
3. Font licensing (Adobe Fonts vs. Google Fonts equivalents)
4. Halal mark placement
5. Trademark registration verification

### 📦 Asset inventory (F:\ source vs. workspace)

| Category | F:\ master | Workspace | Status |
|---|---|---|---|
| Brand book PDF | ✅ + AI source + PPTX | ✅ PDF + TXT only | F:\ is master |
| Characters | 9 files + PSD | 10 files (same set) | duplicate |
| Packaging concepts | 9 mockups + 4 IMG_* | 4 mockups | F:\ has more |
| Kiosk concepts | ✅ illustrated + real-render | ❌ missing | needs sync |
| "STOP" disruption posters | ✅ 2 versions | ❌ missing | needs sync |
| Pitch deck PPTX | ✅ | ❌ missing | needs sync |
| Vector AI source | ✅ × 2 | ❌ | needs sync |
| Reference campaign video | ✅ | ❌ | needs sync |
| Vehicle sticker mockup | ✅ | ❌ | needs sync |
| Legal/Official docs | ✅ | ❌ | leave on F:\ (sensitive) |

## Deliverables produced
- [01_Brand/BRAND.md](../01_Brand/BRAND.md) - locked brand spec
- [01_Brand/tokens.json](../01_Brand/tokens.json) - design tokens (color/type/spacing/motion/pattern)
- [_extract/](.) - PDF pages, video frames, PPTX text, palette report

## Recommended next actions (in order)
1. **Mirror F:\ → workspace** under `_source/` (read-only). Command suggested in next turn.
2. **Restructure** workspace into the 10-folder layout proposed earlier.
3. **Logo round-1**: produce 3 mark directions in Figma + Illustrator.
4. **Plaid v2 swatches** (green-base) - generate 4 density variants.
5. **Storyboard pack**: convert script scenes 1–6 into Veo 3 / Runway prompts.
6. **Website scaffold**: Next.js + Tailwind + shadcn with locked tokens.
