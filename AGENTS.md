# MaMa Zainab - Agent Instructions

> Workspace root: `d:\AI\MaMaZainab`  
> Repository: `SinAi-Inc/MaMaZainab` (AdminUI sub-repo at `11_AdminUI/`)  
> Current date: 2026-05-18  
> Owner: Sheng Heng Wang · 王盛恒 · Technology by SinAI Inc.

---

## 📚 Documentation

All project documentation lives in **[`Doc/`](Doc/README.md)**.

| Doc section | File | Contents |
|-------------|------|----------|
| Master hub | [Doc/README.md](Doc/README.md) | Index, automation system guide |
| Architecture | [Doc/architecture/README.md](Doc/architecture/README.md) | Stack, data flow, conventions |
| API reference | [Doc/api/README.md](Doc/api/README.md) | HTTP routes + server actions |
| Changelog | [Doc/changelog/2026-05.md](Doc/changelog/2026-05.md) | May 2026 commits + pending items |
| Doc generator | [Doc/scripts/generate_docs.py](Doc/scripts/generate_docs.py) | Auto-regenerates all the above |

To regenerate docs from source:

```bash
# from workspace root (.venv must be activated)
python Doc/scripts/generate_docs.py
```

---

## 🗂️ Workspace layout

| Folder | Status | Notes |
|--------|--------|-------|
| `01_Brand/` | ✅ locked | Tokens, logos, plaid v2 |
| `02_Characters/` | ✅ complete | MaMa Zainab, Wong Hong, ZuZu |
| `03_Packaging/` | 🔄 in progress | Awaiting plaid v2 redesign |
| `04_Scripts/` | ✅ complete | Scene 1–6 master script |
| `05_VideoCampaign/` | ✅ complete | STORYBOARD.md + prompt pack |
| `06_Website/` | ⏭️ not started | Public brand website |
| `07_OrderingApp/` | ⏭️ not started | Expo / React Native |
| `08_Locations/` | ⏭️ not started | Kiosk renders, store maps |
| `09_Marketing/` | ⏭️ not started | Social cuts, posters |
| `10_AI_Assets/` | ⏭️ not started | LoRAs, prompt library |
| `11_AdminUI/` | ✅ deployed | Next.js 16 - Vercel prod |
| `Doc/` | ✅ active | This doc system |

---

## 🔖 Latest handoff - 2026-05-18

### Completed this session - Studio model/provider audit & cleanup

**Image generation models - cleaned:**

- Removed Flux.2 Klein from `NVIDIA_IMAGE_MODELS` (NIM not configured, never wired)
- `lib/nvidia/client.ts` now only lists Flux.1 Schnell ($0.003) and Flux.1 Dev ($0.04)
- `lib/ai/cost.ts` cleaned to match (only flux.1-dev, flux.1-schnell, comfyui)
- Studio Image Gen tab dropdown: Schnell first (default), Dev second - no dead entries

**Video generation models - cleaned:**

- Removed `stabilityai/stable-video-diffusion` from `lib/videos/schema.ts` (deprecated model)
- Cleaned `lib/videos/actions.ts` `providerToModel` map - no more SVD references
- Updated `supabase/migration.sql` default_model from SVD → `runway/gen4` in projects + takes tables

**Video provider dropdown - cleaned:**

- Both provider dropdowns (Studio Video tab + Project page) now only show **configured** providers
- Removed disabled "(off)" / "(not configured)" entries - unconfigured providers hidden entirely
- Providers auto-appear when their env var is added (no code changes needed)
- Added Bedrock ($0.01/s) and fal.ai ($0.04/s) to `lib/video/cost.ts`

**Env configuration fixes:**

- Fixed `NVIDIA_NIM_BASE_URL` - was set to placeholder `YOUR_BREV_INSTANCE_URL` (showed as configured but dead); now set to `http://localhost:8000` for local NIM
- Added missing `FAL_KEY=` placeholder to `.env.local`
- Rewrote `.env.local.example` with all current keys: ComfyUI vars, `PARTNER_JWT_SECRET`, `FAL_KEY`, AWS vars, `NEXT_PUBLIC_ADMIN_UI_USERNAME`

**Validated:**

- Flux.1 Schnell generation tested: 1344×768, 149KB, 2.7s - SUCCESS
- NVIDIA content filter confirmed blocking violent/dystopian language (not a bug - safety filter)
- `npm run build` passes cleanly after all changes

### Currently configured providers (local)

| Provider | Env Var | Status |
|----------|---------|--------|
| **NVIDIA API** (images) | `NVIDIA_API_KEY` | ✅ Flux.1 Schnell + Dev |
| **ComfyUI** (images) | `COMFYUI_BASE_URL` | ✅ SDXL workflow |
| **Runway Gen-4.5** (video) | `RUNWAY_API_KEY` | ✅ Hero tier |
| **Amazon Nova Reel** (video) | `AWS_S3_BUCKET` + chain | ✅ Hero tier |
| **Local NIM** (video) | `NVIDIA_NIM_BASE_URL` | ✅ Draft tier (localhost:8000) |
| RunPod Wan 2.2 | `RUNPOD_API_KEY` | ❌ Empty |
| fal.ai | `FAL_KEY` | ❌ Empty |

### Next tasks (pick up here)

1. **Push this cleanup to git** - all changes are local, uncommitted
2. **Verify Vercel deployment** - confirm video dropdown shows only Runway + Bedrock (Vercel has no NIM URL)
3. **Begin `06_Website/`** - public brand website
4. **Begin `07_OrderingApp/`** - Expo / React Native ordering app

---

### Previous handoff - 2026-05-10

| Commit | Description |
|--------|-------------|
| `1c38c71` | Fix: rename `middleware.ts` → `proxy.ts` per Next.js 16 convention |
| `54382ce` | Fix: partner_settings - return defaults on Supabase error |
| `c840754` | Feat: partner admin save error feedback UI |
| `31c362d` | Feat: inline notify confirmation card (no page redirect) |
| `9afee2d` | Fix: notify API returns JSON (not redirect) - resolves "Something went wrong" |
| `1184b95` | Fix: generations read returns empty on Supabase error (graceful) |
| `bdcd8ee` | Fix: migration.sql - `CREATE POLICY IF NOT EXISTS` → `DO $$` blocks |
| `93bd45b` | Fix: server action returns `{ error }` instead of throwing (prod error visibility) |
| `9d1a1c2` | Fix: remove `writeJson` from Supabase path in partner store (EROFS) |
| `832daf6` | Fix: clear error message when Supabase env vars missing on Vercel |

### Supabase migration - ✅ DONE

All tables created in Supabase SQL Editor: `contacts`, `menu_categories`, `menu_items`, `settings`, `characters`, `branches`, `projects`, `generations`, `scenes`, `shots`, `takes`, `partner_settings`, storage bucket + policies.

### Vercel env vars - ✅ DONE

All env vars set in Vercel and redeployed. Supabase reads/writes working in production.
Credential rotation completed locally and in Vercel. Legacy Supabase JWT secret flow is disabled; current setup uses the new server secret key and fresh admin/partner session secrets.

### Next tasks (pick up here)

1. **Verify rotated credential cutover** - confirm local/prod reads now use `SUPABASE_SECRET_KEY`, env-only `NVIDIA_API_KEY`, and fresh admin/partner session secrets
2. **Verify deployed hardening** - confirm partner portal requires a server session and AdminUI generation still works with env-only `NVIDIA_API_KEY`
3. **Begin `06_Website/`** - public brand website
4. **Begin `07_OrderingApp/`** - Expo / React Native ordering app

### Last completed work (as of 2026-05-09)

| Commit | Description |
|--------|-------------|
| `2cce755` | Fix: Supabase dual-mode for generations, SCENE_CONTEXTS chr_ IDs, migration table |
| `de03fd3` | Feat: Studio single-source characters, generation history, Brand Bible rewrite |
| `7741a6e` | Fix: hide ZuZu below md breakpoint, wrap-safe social links (760px viewport) |
| `cf7ee0f` | Feat: Supabase dual-mode persistence (JSON fallback for local dev) |
| `33ecb65` | Security: rate limit POST /api/notify - 3 req/min per IP |
| `983aa3f` | Style: scale coming-soon page to 80% - tighter layout for browser fit |
| `8c06ea8` | Content: add 7 menu photos + update menu data |

### Completed this session (pushed `de03fd3` + `2cce755`)

- **Studio ↔ Characters single source of truth** - Removed hardcoded `CHARACTER_ANCHORS` from `lib/ai/brand-bible.ts`. Replaced with `buildAnchorsFromCharacters()` that derives anchor options dynamically from `characters.json` at runtime. Multi-mode characters (Wong: Warrior/Business) auto-expand into separate dropdown entries.
- **Character reference images in Studio** - Both Image Gen and Video Gen tabs now show a reference photo thumbnail below the character dropdown, sourced from the character's `referenceImages[]` in `characters.json`.
- **Generation history + save system** - New `lib/generations/` module (schema, store, server actions). Generations auto-save to `data/generations.json` (max 200 entries). Base64 outputs are written to `public/uploads/generations/`. New "History" tab (4th tab) in Studio shows a grid of past generations with download/delete/clear-all.
- **Supabase dual-mode for generations** - `lib/generations/store.ts` uses Supabase when configured (Vercel), JSON fallback for local dev. New `generations` table in `supabase/migration.sql`.
- **Brand Bible page rewrite** - 6-tab layout with interactive panels sourced from `lib/brand-bible-data.ts` and `app/(admin)/brand/_components/brand-bible-panels.tsx`.
- **Ghost ID fix** - `assemblePrompt()` ghost check updated from exact `"char_ghost"` match to `.includes("ghost")` to handle `chr_ghost_zainab` from characters.json.
- **SCENE_CONTEXTS ID cleanup** - All `char_` prefix IDs updated to `chr_` prefix matching characters.json (`char_ghost` → `chr_ghost_zainab`).
- **Character data enrichment** - `data/characters.json` updated with `active` field, enriched reference images, identity fields.
- **Menu contrast reviewed** ✅ - Preview and print pages handle plaid contrast correctly (dark overlays on hero, minimal opacity on body).
- **Build verified** ✅ - `npm run build` passes cleanly.

### Next tasks (pick up here)

1. **Verify rotated credential cutover** - confirm local/Vercel now use `SUPABASE_SECRET_KEY`, fresh admin/partner session secrets, and env-only NVIDIA credentials.

2. **Verify Vercel deployment** after push  
  Check `https://ma-ma-zainab.vercel.app` - partner portal auth gate, Studio generation, History tab, and Brand Bible tabs.

3. **Begin `06_Website/`** - public brand website.

4. **Begin `07_OrderingApp/`** - Expo / React Native ordering app.

---

## ⚙️ Sub-module agent rules

- **11_AdminUI** has its own `AGENTS.md` and `CLAUDE.md` - **read them before touching any Next.js code.**
  Key rule: this Next.js version has breaking changes. Read `node_modules/next/dist/docs/` before writing code.
- **Zod + RHF:** `useForm<z.input<Schema>, unknown, z.output<Schema>>` when schema uses `.default()` or `.coerce`.
- **No secrets:** zero `.env` required locally. `data/contacts.json` and `data/videos.json` are gitignored.
- **npm audit:** must stay at 0 vulnerabilities.

---

## 🚀 Quick start

```bash
# Admin UI (local dev)
cd 11_AdminUI
npm install
npm run dev          # http://localhost:3333

# Regenerate all docs
cd ..
python Doc/scripts/generate_docs.py
```

---

_This file is the workspace-level agent entrypoint. For AdminUI-specific rules see [11_AdminUI/AGENTS.md](11_AdminUI/AGENTS.md)._
