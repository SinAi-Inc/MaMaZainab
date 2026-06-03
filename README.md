# MaMa Zainab - Brand Workspace

Single source of truth for the **MaMa Zainab** oriental fast-food chain - brand, video campaign, packaging, web, app, and store rollout.

> **Owned & Operated by Sheng Heng Wang (王盛恒) · 王盛恒餐饮投资集团有限公司**  
> Technology by [SinAI Inc.](https://sinai-inc.com)

---

## Workspace structure

| # | Folder | Contents | Status |
|---|--------|----------|--------|
| 01 | [01_Brand/](01_Brand/) | Locked tokens, guidelines, gingham plaid v2, logo finals | ✅ v2026.05 locked |
| 02 | [02_Characters/](02_Characters/) | Mama Zainab, Wong, ZuZu Goose, Ghost - refs + bible | 🔄 in progress |
| 03 | [03_Packaging/](03_Packaging/) | Box, holder, takeaway pillar, kiosk sauce packets | 🔄 awaiting redesign |
| 04 | [04_Scripts/](04_Scripts/) | Cinematic launch script (Scene 1–6) + ad scripts | ✅ master script complete |
| 05 | [05_VideoCampaign/](05_VideoCampaign/) | Storyboard, AI prompt pack, veo renders | ✅ STORYBOARD.md ready |
| 06 | [06_Website/](06_Website/) | Public brand website | ⏭️ not started |
| 07 | [07_OrderingApp/](07_OrderingApp/) | Expo / React Native ordering app | ⏭️ not started |
| 08 | [08_Locations/](08_Locations/) | Kiosk renders, store maps, signage specs | ⏭️ not started |
| 09 | [09_Marketing/](09_Marketing/) | Social cuts, posters, "STOP" series | ⏭️ not started |
| 10 | [10_AI_Assets/](10_AI_Assets/) | LoRAs, character image refs, prompt library | ⏭️ not started |
| 11 | [11_AdminUI/](11_AdminUI/) | Next.js admin dashboard + all public pages | ✅ deployed |
| - | [_source/](_source/) | Read-only mirrors of F:\ master assets | ✅ selective mirror |
| - | [_extract/](_extract/) | PDF pages, video frames, brand audit | ✅ |
| - | [fonts/](fonts/) | Chinese Monoline, Lucida Handwriting, Kozuka | ✅ |
| - | [Profile/](Profile/) | Founder / company profile assets | 🔄 in progress |

---

## Identity (locked)

| Property | Value |
|----------|-------|
| Brand name | **MaMa Zainab** · ماما زينب |
| Owner | Sheng Heng Wang · 王盛恒先生 |
| Company | 王盛恒餐饮投资集团有限公司 |
| Nationality | China · 中华人民共和国 |
| Launch market | Alexandria, Egypt · 埃及·亚历山大 |
| Year | 2026 - present |
| Promise | Authentic Mahshi. Homemade Taste. Fast-Food Speed. |
| Y1 target | 100 branches |

### Brand colours

| Role | Hex |
|------|-----|
| Green (primary) | `#1B9B00` |
| Yellow (accent) | `#EFD200` |
| Ink | `#1E1A14` |
| Paper | `#FAFAF5` |

### Typography

| Role | Typeface |
|------|---------|
| Display / logo | Chinese Monoline |
| Headline | Bebas Neue |
| Body (Latin) | Poppins |
| Body (Arabic) | Cairo |

---

## Admin UI (`11_AdminUI`)

Next.js 16 app - admin dashboard and public brand pages.
**Dev:** `cd 11_AdminUI && npm run dev` → `http://localhost:3333`

| Public page | URL |
|-------------|-----|
| Coming Soon | `/coming-soon` |
| Menu preview | `/menu/preview` |
| Corporate (Chinese) | `/cn` |

| Admin page | URL |
|------------|-----|
| Menu management | `/menu` |
| Video studio | `/videos` |
| Contact list | `/contacts` |

---

## Security & IP protection

- `11_AdminUI/data/contacts.json` - gitignored (subscriber emails)
- `11_AdminUI/data/videos.json` - gitignored (brand scripts, business IP)
- `04_Scripts/` - local only, not committed (cinematic scripts + strategy)
- No credentials or API keys anywhere in this repo
- Git history rewritten (`git filter-repo`) - no accidental prior commits of the above

---

## Conventions

- All paths relative to workspace root.
- Spelling: only **MaMa Zainab** (camelCase M and Z) - see [01_Brand/BRAND.md](01_Brand/BRAND.md).
- Files in `_source/` are **read-only** mirrors - re-sync from `F:\H.Q\SinAI Inc\R&D Docs\Mama Zainab` master if needed.
