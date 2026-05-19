# MaMa Zainab — Documentation Hub

> Single entry point for all project documentation, auto-generated reports, architecture notes, changelogs, and API references.

**Workspace root:** `d:\AI\MaMaZainab`  
**Technology by [SinAI Inc.](https://sinai-inc.com)**  
**Owner:** Sheng Heng Wang · 王盛恒 · 王盛恒餐饮投资集团有限公司

---

## 📁 Doc folder map

```
Doc/
├── README.md                ← This file — master hub & system guide
├── architecture/
│   └── README.md            ← System architecture, stack decisions, data flow
├── api/
│   └── README.md            ← All API routes, payloads, and response shapes
├── changelog/
│   └── 2026-05.md           ← Monthly changelog (one file per month)
└── scripts/
    └── generate_docs.py     ← Automated doc generation runner
```

---

## 🤖 Automated Documentation System

The `Doc/scripts/generate_docs.py` script automatically extracts and regenerates documentation from workspace source files. Run it any time files change.

### What it generates

| Output file | Source | Description |
|-------------|--------|-------------|
| `Doc/api/README.md` | `11_AdminUI/app/api/` | All API route handlers → method, path, payload, response |
| `Doc/architecture/README.md` | `11_AdminUI/`, workspace folders | Stack + folder status table |
| `Doc/changelog/YYYY-MM.md` | `11_AdminUI/` git log | Commits grouped by month |

### How to run

```bash
# from workspace root (requires .venv activated)
python Doc/scripts/generate_docs.py

# or individual sections
python Doc/scripts/generate_docs.py --section api
python Doc/scripts/generate_docs.py --section architecture
python Doc/scripts/generate_docs.py --section changelog
```

### Scheduling (optional)

To run automatically on every git commit, add a pre-push hook:

```bash
# 11_AdminUI/.git/hooks/pre-push  (chmod +x)
#!/bin/sh
cd ../..
python Doc/scripts/generate_docs.py
git -C 11_AdminUI add -A ../Doc/
```

---

## 📖 Manual Documentation

The following are human-authored and should be updated by hand:

| File | What to keep here |
|------|-------------------|
| [Doc/architecture/README.md](architecture/README.md) | Design decisions, trade-offs, diagrams |
| [Doc/api/README.md](api/README.md) | Detailed request/response examples, auth notes |
| [Doc/changelog/YYYY-MM.md](changelog/) | Release notes, hotfixes, rollbacks |

---

## 🔗 Quick links to source docs

| Module | Key doc |
|--------|---------|
| Brand tokens | [01_Brand/BRAND.md](../01_Brand/BRAND.md) |
| Characters bible | [02_Characters/CHARACTERS.md](../02_Characters/CHARACTERS.md) |
| Launch script | [04_Scripts/MaMa Zainab.md](../04_Scripts/MaMa%20Zainab.md) |
| Video storyboard | [05_VideoCampaign/STORYBOARD.md](../05_VideoCampaign/STORYBOARD.md) |
| Admin UI readme | [11_AdminUI/README.md](../11_AdminUI/README.md) |
| Last audit | [11_AdminUI/_screenshots/2026-05-05/AUDIT.md](../11_AdminUI/_screenshots/2026-05-05/AUDIT.md) |
| Brand audit | [_extract/BRAND_AUDIT.md](../_extract/BRAND_AUDIT.md) |

---

## ✍️ How to contribute to docs

1. **Auto-generated files** — do not edit by hand. Re-run `generate_docs.py` instead.
2. **Manual files** — edit directly in this `Doc/` folder.
3. **New module?** — add a row to the table above and create `Doc/<module>/README.md`.
4. **Screenshots / audits** — continue using `11_AdminUI/_screenshots/YYYY-MM-DD/AUDIT.md`.

---

_Last updated: 2026-05-06 · Auto-system version: 0.1_
