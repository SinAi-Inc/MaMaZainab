"""
Export a clean prompt pack from videos.json.
Produces:
  05_VideoCampaign/prompt_pack.json   - structured JSON for pipeline tools
  05_VideoCampaign/prompt_pack.md     - human-readable copy-paste sheet
Run from workspace root: python _tools/export_prompt_pack.py
"""

import json, re, textwrap
from pathlib import Path

DATA = Path("11_AdminUI/data/videos.json")
CHARS_BASE = "/brand/chars"

# Character reference anchor text for image generators (no [REF:...] syntax)
CHAR_DESC = {
    "wong": (
        "East-Asian man in his 60s, silver-streaked hair, weathered battle-scarred face, "
        "dark silken warrior robes"
    ),
    "zainab": (
        "Egyptian woman in her 50s, warm kind face, colorful floral headscarf, "
        "green-base plaid apron with yellow stripes"
    ),
    "zuzu": (
        "plump white domestic goose, tiny green-yellow plaid ribbon around its neck, "
        "curious orange beak, expressive eyes"
    ),
    "ghost": (
        "translucent luminous-green younger version of an Egyptian woman, "
        "pale #1B9B00 green glow, wind-blown"
    ),
}

CHAR_REF_FILES = {
    "wong":   f"{CHARS_BASE}/wong-hong.png",
    "zainab": f"{CHARS_BASE}/mama-zainab.jpeg",
    "zuzu":   f"{CHARS_BASE}/zuzu.jpeg",
}

STYLE_SUFFIX = (
    "shot on ARRI Alexa 35, anamorphic 2.39:1, cinematic color grade, "
    "warm Mediterranean highlights + cool teal shadows, volumetric haze, "
    "photoreal, film grain, no text overlay"
)

NEGATIVE = (
    "no logos, no readable text, no warped faces, no extra fingers, "
    "no duplicated characters, no plastic skin, no AI artifact shimmer, "
    "no cartoon style, no anime, no watermark"
)

def img_prompt(video_prompt: str) -> str:
    """Strip audio/dialogue cues and [REF:...] for use in image generators."""
    p = re.sub(r'\[REF:[^\]]+\]', '', video_prompt)
    p = re.sub(r'Dialogue.*?(?=\n|$)', '', p, flags=re.DOTALL)
    p = re.sub(r'Audio:.*?(?=\n|$)', '', p)
    p = re.sub(r'\s+', ' ', p).strip()
    return p

def detect_chars(prompt: str) -> list[str]:
    hits = []
    if "WongHong" in prompt or "warrior" in prompt.lower() and "east-asian" in prompt.lower():
        hits.append("wong")
    if "Mama Zainab" in prompt or "Egyptian woman" in prompt:
        hits.append("zainab")
    if "ZuZu" in prompt or "white goose" in prompt.lower():
        hits.append("zuzu")
    if "Ghost" in prompt and "Zainab" in prompt:
        hits.append("ghost")
    return hits

with open(DATA, encoding="utf-8") as f:
    data = json.load(f)

project = data["projects"][0]
scenes  = {s["id"]: s for s in data["scenes"]}
shots   = data["shots"]

pack = {
    "project": {
        "id":          project["id"],
        "title":       project["title"],
        "logline":     project["logline"],
        "aspectRatio": project["aspectRatio"],
        "targetRuntime": f"{project['targetDurationSec'] // 60}:{project['targetDurationSec'] % 60:02d}",
        "defaultModel":  project["defaultModel"],
        "styleSuffix":   STYLE_SUFFIX,
        "negativePrompt": NEGATIVE,
    },
    "characters": {
        k: {"description": v, "refImage": CHAR_REF_FILES.get(k, "")}
        for k, v in CHAR_DESC.items()
    },
    "scenes": [],
}

# Scene heading map (number → heading)
scene_by_proj_and_num = {}
for s in data["scenes"]:
    scene_by_proj_and_num[s["id"]] = s

scene_groups: dict[str, list] = {}
for shot in shots:
    scene_groups.setdefault(shot["sceneId"], []).append(shot)

for sc in sorted(data["scenes"], key=lambda x: x["number"]):
    sc_shots = sorted(scene_groups.get(sc["id"], []), key=lambda x: x["sort"])
    shots_out = []
    for sh in sc_shots:
        chars = detect_chars(sh["prompt"])
        shots_out.append({
            "id":          sh["id"],
            "number":      sh["number"],
            "type":        sh["type"],
            "durationSec": sh["durationSec"],
            "description": sh["description"],
            "dialogue":    sh["dialogue"],
            "cameraNotes": sh["cameraNotes"],
            "characters":  chars,
            "refImages":   [CHAR_REF_FILES[c] for c in chars if c in CHAR_REF_FILES],
            "videoPrompt": sh["prompt"],
            "imagePrompt": img_prompt(sh["prompt"]),
            "status":      sh["status"],
        })

    total_dur = sum(sh["durationSec"] for sh in sc_shots)
    pack["scenes"].append({
        "id":       sc["id"],
        "number":   sc["number"],
        "heading":  sc["heading"] or sc["summary"][:80],
        "totalSec": total_dur,
        "shots":    shots_out,
    })

total_shots = sum(len(sc["shots"]) for sc in pack["scenes"])
total_dur   = sum(sc["totalSec"] for sc in pack["scenes"])

pack["summary"] = {
    "scenes": len(pack["scenes"]),
    "shots":  total_shots,
    "totalRuntime": f"{total_dur // 60}:{total_dur % 60:02d}",
}

# ── Write JSON ──────────────────────────────────────────────────────────────
out_json = Path("05_VideoCampaign/prompt_pack.json")
out_json.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {out_json}")

# ── Write Markdown ──────────────────────────────────────────────────────────
md_lines = [
    f"# Prompt Pack - {project['title']}",
    f"**Logline:** {project['logline']}",
    f"**Target runtime:** {pack['project']['targetRuntime']} · **Aspect ratio:** {project['aspectRatio']} · **Primary model:** {project['defaultModel']}",
    f"**Shots:** {total_shots} across {len(pack['scenes'])} scenes · **Total cut:** {pack['summary']['totalRuntime']}",
    "",
    "## Global Style Suffix",
    f"```\n{STYLE_SUFFIX}\n```",
    "",
    "## Negative Prompt",
    f"```\n{NEGATIVE}\n```",
    "",
    "## Character References",
]
for k, v in CHAR_DESC.items():
    ref = CHAR_REF_FILES.get(k, "N/A")
    md_lines += [f"- **{k.upper()}** `{ref}` - {v}"]

md_lines += ["", "---", ""]

for sc in pack["scenes"]:
    md_lines += [
        f"## Scene {sc['number']} - {sc['heading']}",
        f"*{sc['totalSec']}s total*",
        "",
    ]
    for sh in sc["shots"]:
        chars_str = ", ".join(f"`{c}`" for c in sh["characters"]) or "—"
        md_lines += [
            f"### Shot {sh['number']} · {sh['type'].upper()} · {sh['durationSec']}s",
            f"**Description:** {sh['description']}",
        ]
        if sh["dialogue"]:
            md_lines += [f"**Dialogue:** _{sh['dialogue']}_"]
        if sh["cameraNotes"]:
            md_lines += [f"**Camera:** {sh['cameraNotes']}"]
        md_lines += [
            f"**Characters:** {chars_str}",
            "",
            "#### Video prompt (Veo 3 / Runway / Kling)",
            f"```\n{sh['videoPrompt']}\n```",
            "",
            "#### Image prompt (Midjourney / Flux / DALL-E 3)",
            f"```\n{sh['imagePrompt']}\n```",
            "",
        ]
    md_lines += ["---", ""]

out_md = Path("05_VideoCampaign/prompt_pack.md")
out_md.write_text("\n".join(md_lines), encoding="utf-8")
print(f"Wrote {out_md}")

# Print summary
print(f"\nSummary: {total_shots} shots, {len(pack['scenes'])} scenes, {pack['summary']['totalRuntime']} runtime")
for sc in pack["scenes"]:
    print(f"  Scene {sc['number']}: {len(sc['shots'])} shots  {sc['totalSec']}s  {sc['heading'][:60]}")
