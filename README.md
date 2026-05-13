# MaMa Zainab — Admin UI (`11_AdminUI`)

Brand management dashboard and public-facing pages for the **MaMa Zainab** oriental fast-food chain. Built with Next.js 15 App Router.

> **Owned & Operated by Sheng Heng Wang · Technology by [SinAI Inc.](https://sinai-inc.com)**

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4 — brand tokens via CSS vars |
| Validation | Zod |
| Fonts | Chinese Monoline (brand) via `next/font/local` |
| Persistence | JSON files in `data/` (reads work on Vercel; writes need a DB for persistence) |
| Icons | Lucide React |

---

## Local development

```bash
cd 11_AdminUI
npm install
npm run dev        # http://localhost:3333
```

---

## Route map

### Public routes

| Route | Description |
|-------|-------------|
| `/coming-soon` | Launch page — countdown, notify form, social links |
| `/menu/preview` | Brand-accurate menu preview |
| `/menu/print` | Print-optimised menu layout |
| `/cn` | Corporate ownership page (王盛恒餐饮投资集团有限公司) |

### Admin routes (route group `(admin)` — no URL prefix)

| Route | Description |
|-------|-------------|
| `/menu` | Menu management — categories + items CRUD |
| `/website` | Website preview |
| `/videos` | Video campaign studio |
| `/contacts` | Contact list — subscribers from notify form |

### API

| Route | Description |
|-------|-------------|
| `POST /api/notify` | Coming-soon email subscription → writes to `data/contacts.json` |

---

## Data directory

```
data/
  menu.json        ← menu categories & items  (tracked — publicly visible on /menu/preview)
  contacts.json    ← subscriber emails         (gitignored — never committed)
  videos.json      ← video project state       (gitignored — business IP)
```

---

## Security

- `data/contacts.json` and `data/videos.json` are **gitignored** — never committed.
- No hardcoded secrets, API keys, or credentials in source.
- No `.env` files required to run.
- PostCSS XSS (GHSA-qx2v-qp2m-jg93) fixed via `overrides: { postcss: ">=8.5.10" }`.
- `npm audit` → **0 vulnerabilities**.

---

## Deployment (Vercel)

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** → `11_AdminUI`
3. Framework auto-detected as Next.js — no env vars required
4. Deploy

> Public pages (`/coming-soon`, `/menu/preview`, `/cn`) work fully on serverless.  
> Admin writes (menu CRUD, contact delete) need Vercel Postgres or Turso for persistence across deployments.
