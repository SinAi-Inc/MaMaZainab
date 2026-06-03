# MaMa Zainab - Admin UI (`11_AdminUI`)

Brand management dashboard and public-facing pages for the **MaMa Zainab** oriental fast-food chain. Built with Next.js 16 App Router.

> **Owned & Operated by Sheng Heng Wang · Technology by [SinAI Inc.](https://sinai-inc.com)**

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4 - brand tokens via CSS vars |
| Validation | Zod |
| Fonts | Chinese Monoline (brand) via `next/font/local` |
| Persistence | Supabase in production, JSON fallback locally |
| Icons | Lucide React |

---

## Local development

```bash
cd 11_AdminUI
npm install
npm run dev        # http://localhost:3333
```

For admin writes and production-like local testing, set server env vars in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (preferred) or `SUPABASE_SERVICE_ROLE_KEY` (legacy fallback)
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`
- `PARTNER_JWT_SECRET` (optional; falls back to `ADMIN_JWT_SECRET`)
- `NVIDIA_API_KEY` for AI generation

---

## Route map

### Public routes

| Route | Description |
|-------|-------------|
| `/coming-soon` | Launch page - countdown, notify form, social links |
| `/menu/preview` | Brand-accurate menu preview |
| `/menu/print` | Print-optimised menu layout |
| `/cn` | Corporate ownership page (王盛恒餐饮投资集团有限公司) |

### Admin routes (route group `(admin)` - no URL prefix)

| Route | Description |
|-------|-------------|
| `/menu` | Menu management - categories + items CRUD |
| `/website` | Website preview |
| `/videos` | Video campaign studio |
| `/contacts` | Contact list - subscribers from notify form |

### API

| Route | Description |
|-------|-------------|
| `POST /api/notify` | Coming-soon email subscription → writes to `data/contacts.json` |

---

## Data directory

```text
data/
  menu.json        ← menu categories & items  (tracked - publicly visible on /menu/preview)
  contacts.json    ← subscriber emails         (gitignored - never committed)
  videos.json      ← video project state       (gitignored - business IP)
```

---

## Security

- `data/contacts.json` and `data/videos.json` are **gitignored** - never committed.
- No hardcoded secrets, API keys, or credentials in source.
- Server secrets live in environment variables and are not persisted in tracked settings files.
- Supabase server access supports `SUPABASE_SECRET_KEY` and the legacy `SUPABASE_SERVICE_ROLE_KEY` fallback during migration.
- PostCSS XSS (GHSA-qx2v-qp2m-jg93) fixed via `overrides: { postcss: ">=8.5.10" }`.
- `npm audit` → **0 vulnerabilities**.

---

## Deployment (Vercel)

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** → `11_AdminUI`
3. Set required env vars for Supabase, admin auth, partner auth, and AI generation
4. Deploy

> Public pages (`/coming-soon`, `/menu/preview`, `/cn`) work fully on serverless.  
> Admin writes and partner/admin auth require the server env vars above. Supabase-backed persistence is the intended production path.

### Production persistence

- Vercel must have `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` set for menu updates and uploads.
- Menu photo uploads write to the public Supabase Storage bucket named `uploads`, then return `/uploads/...` URLs that Vercel rewrites to Supabase Storage.
- Hosted Vercel does not use local JSON or local disk fallbacks for admin menu writes. If Supabase is missing, the Admin UI shows a configuration error instead of silently depending on a local dev server.
- Re-run `supabase/migration.sql` after storage policy changes so the `uploads` bucket remains public-readable and service-role writable.
