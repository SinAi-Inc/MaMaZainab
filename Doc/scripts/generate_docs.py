#!/usr/bin/env python3
"""
MaMa Zainab - Automated Documentation Generator
================================================
Regenerates Doc/ sections from workspace source files.

Usage:
    python Doc/scripts/generate_docs.py                    # all sections
    python Doc/scripts/generate_docs.py --section api
    python Doc/scripts/generate_docs.py --section architecture
    python Doc/scripts/generate_docs.py --section changelog

Requires: Python 3.10+ · no external dependencies (stdlib only)
"""

import argparse
import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path

# ── paths ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]          # workspace root
ADMIN = ROOT / "11_AdminUI"
DOC = ROOT / "Doc"


# ══════════════════════════════════════════════════════════════════════════
# SECTION: API
# ══════════════════════════════════════════════════════════════════════════

def _scan_api_routes() -> list[dict]:
    """Walk 11_AdminUI/app/api and extract route info."""
    routes = []
    api_dir = ADMIN / "app" / "api"
    if not api_dir.exists():
        return routes
    for route_file in sorted(api_dir.rglob("route.ts")):
        rel = route_file.relative_to(ADMIN / "app" / "api")
        path = "/" + str(rel.parent).replace("\\", "/")
        if path == "/.":
            path = "/"
        source = route_file.read_text(encoding="utf-8")
        methods = re.findall(r"^export async function (GET|POST|PUT|PATCH|DELETE)", source, re.MULTILINE)
        routes.append({"path": f"/api{path}", "methods": methods, "file": str(route_file.relative_to(ROOT))})
    return routes


def _scan_server_actions() -> list[dict]:
    """Find all exported async functions in lib/*/actions.ts."""
    actions = []
    lib_dir = ADMIN / "lib"
    if not lib_dir.exists():
        return actions
    for actions_file in sorted(lib_dir.rglob("actions.ts")):
        source = actions_file.read_text(encoding="utf-8")
        fns = re.findall(r"^export async function (\w+)", source, re.MULTILINE)
        rel = str(actions_file.relative_to(ROOT))
        for fn in fns:
            actions.append({"fn": fn, "file": rel})
    return actions


def generate_api_doc():
    routes = _scan_api_routes()
    actions = _scan_server_actions()
    now = datetime.now().strftime("%Y-%m-%d")

    lines = [
        "# API Reference - MaMa Zainab Admin UI",
        "",
        "> Auto-generated - do not edit by hand. Run `python Doc/scripts/generate_docs.py --section api` to refresh.",
        f"> Last generated: {now}",
        "",
        f"> Base URL (prod): `https://ma-ma-zainab.vercel.app`  ",
        "> Base URL (local): `http://localhost:3333`",
        "",
        "---",
        "",
        "## HTTP Routes",
        "",
    ]

    if routes:
        lines += ["| Path | Methods | Source |", "|------|---------|--------|"]
        for r in routes:
            methods = ", ".join(f"`{m}`" for m in r["methods"]) or "—"
            lines.append(f"| `{r['path']}` | {methods} | `{r['file']}` |")
    else:
        lines.append("_No API routes found._")

    lines += ["", "---", "", "## Server Actions", ""]

    if actions:
        lines += ["| Action | File |", "|--------|------|"]
        for a in actions:
            lines.append(f"| `{a['fn']}` | `{a['file']}` |")
    else:
        lines.append("_No server actions found._")

    lines += ["", "---", "", f"_Auto-generated {now}_", ""]

    out = DOC / "api" / "README.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[api]  Written → {out.relative_to(ROOT)}")


# ══════════════════════════════════════════════════════════════════════════
# SECTION: ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════

FOLDER_DESCRIPTIONS = {
    "01_Brand": "Brand tokens, logo finals, plaid v2, guidelines",
    "02_Characters": "Character bible - MaMa Zainab, Wong Hong, ZuZu",
    "03_Packaging": "Box, holder, kiosk packaging renders",
    "04_Scripts": "Cinematic launch script (Scene 1–6)",
    "05_VideoCampaign": "Storyboard, AI prompt pack, Veo render notes",
    "06_Website": "Public brand website",
    "07_OrderingApp": "Expo / React Native ordering app",
    "08_Locations": "Store maps, kiosk renders",
    "09_Marketing": "Social cuts, posters",
    "10_AI_Assets": "LoRAs, prompt library",
    "11_AdminUI": "Next.js admin + all public pages",
    "Doc": "This documentation hub",
    "_extract": "Brand audit, PDF pages, video frames",
    "_source": "Read-only asset mirrors",
    "fonts": "Brand typefaces",
    "Profile": "Founder / company profile assets",
}

STATUS_MAP = {
    "01_Brand": "✅ locked",
    "02_Characters": "✅ complete",
    "03_Packaging": "🔄 in progress",
    "04_Scripts": "✅ complete",
    "05_VideoCampaign": "✅ complete",
    "06_Website": "⏭️ not started",
    "07_OrderingApp": "⏭️ not started",
    "08_Locations": "⏭️ not started",
    "09_Marketing": "⏭️ not started",
    "10_AI_Assets": "⏭️ not started",
    "11_AdminUI": "✅ deployed",
    "Doc": "✅ active",
}


def _get_package_json() -> dict:
    pkg = ADMIN / "package.json"
    if pkg.exists():
        return json.loads(pkg.read_text(encoding="utf-8"))
    return {}


def generate_architecture_doc():
    pkg = _get_package_json()
    deps = pkg.get("dependencies", {})
    now = datetime.now().strftime("%Y-%m-%d")

    folders = [f for f in ROOT.iterdir() if f.is_dir() and not f.name.startswith(".")]
    folders.sort(key=lambda f: f.name)

    lines = [
        "# Architecture - MaMa Zainab Platform",
        "",
        "> Auto-generated - do not edit by hand. Run `python Doc/scripts/generate_docs.py --section architecture` to refresh.",
        f"> Last generated: {now}",
        "",
        "---",
        "",
        "## Workspace folder map",
        "",
        "| Folder | Description | Status |",
        "|--------|-------------|--------|",
    ]

    for f in folders:
        name = f.name
        desc = FOLDER_DESCRIPTIONS.get(name, "—")
        status = STATUS_MAP.get(name, "—")
        lines.append(f"| `{name}/` | {desc} | {status} |")

    lines += [
        "",
        "---",
        "",
        "## 11_AdminUI dependencies (from package.json)",
        "",
        "| Package | Version |",
        "|---------|---------|",
    ]
    for pkg_name, version in sorted(deps.items()):
        lines.append(f"| `{pkg_name}` | `{version}` |")

    lines += [
        "",
        "---",
        "",
        f"_Auto-generated {now}_",
        "",
    ]

    out = DOC / "architecture" / "README.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[arch] Written → {out.relative_to(ROOT)}")


# ══════════════════════════════════════════════════════════════════════════
# SECTION: CHANGELOG
# ══════════════════════════════════════════════════════════════════════════

def _git_log(repo: Path, since: str | None = None) -> list[dict]:
    """Return list of {hash, date, subject} from git log."""
    cmd = ["git", "-C", str(repo), "log", "--pretty=format:%H|%ad|%s", "--date=short"]
    if since:
        cmd += [f"--since={since}"]
    try:
        out = subprocess.check_output(cmd, text=True, encoding="utf-8", errors="replace", stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        return []
    entries = []
    for line in out.strip().splitlines():
        parts = line.split("|", 2)
        if len(parts) == 3:
            entries.append({"hash": parts[0][:7], "date": parts[1], "subject": parts[2]})
    return entries


def generate_changelog_doc():
    now = datetime.now()
    year_month = now.strftime("%Y-%m")
    since = f"{year_month}-01"

    entries = _git_log(ADMIN, since=since)
    month_label = now.strftime("%B %Y")

    lines = [
        f"# Changelog - {month_label}",
        "",
        "> Auto-generated - do not edit by hand. Run `python Doc/scripts/generate_docs.py --section changelog` to refresh.",
        f"> Last generated: {now.strftime('%Y-%m-%d')}",
        "",
        f"> Branch: `main` · Repo: `SinAi-Inc/MaMaZainab` (11_AdminUI git repo)",
        "",
        "---",
        "",
    ]

    if entries:
        current_date = None
        for e in entries:
            if e["date"] != current_date:
                current_date = e["date"]
                lines += [f"## {current_date}", ""]
            lines.append(f"- **`{e['hash']}`** {e['subject']}")
        lines.append("")
    else:
        lines.append("_No commits this month yet._")
        lines.append("")

    lines += ["---", "", f"_Auto-generated {now.strftime('%Y-%m-%d')}_", ""]

    out = DOC / "changelog" / f"{year_month}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[log]  Written → {out.relative_to(ROOT)}")


# ══════════════════════════════════════════════════════════════════════════
# ENTRYPOINT
# ══════════════════════════════════════════════════════════════════════════

SECTIONS = {
    "api": generate_api_doc,
    "architecture": generate_architecture_doc,
    "changelog": generate_changelog_doc,
}


def main():
    parser = argparse.ArgumentParser(description="MaMa Zainab doc generator")
    parser.add_argument(
        "--section",
        choices=list(SECTIONS.keys()),
        help="Generate only this section. Omit to generate all.",
    )
    args = parser.parse_args()

    if args.section:
        SECTIONS[args.section]()
    else:
        for name, fn in SECTIONS.items():
            fn()

    print("Done.")


if __name__ == "__main__":
    main()
