"""
Batch keyframe generation for all shots in data/prompt-pack.json
using the NVIDIA API Catalog (Flux.1 Schnell by default).

Reads NVIDIA_API_KEY from 11_AdminUI/.env.local
Saves PNGs to   11_AdminUI/public/uploads/keyframes/<number>_<id>.png
Updates         11_AdminUI/data/prompt-pack.json  (keyframeUrl, keyframeSeed, status)

Cost estimate:
  Schnell  ($0.003 / image) × 46 shots ≈ $0.14
  Dev      ($0.040 / image) × 46 shots ≈ $1.84

Usage:
  python _tools/batch_keyframes_nvidia.py                # all shots, Schnell
  python _tools/batch_keyframes_nvidia.py --dry-run      # print prompts, no API calls
  python _tools/batch_keyframes_nvidia.py --shot=1.1     # single shot
  python _tools/batch_keyframes_nvidia.py --start=5      # skip first 5 shots
  python _tools/batch_keyframes_nvidia.py --model=dev    # use Flux.1 Dev (slower, better)
  python _tools/batch_keyframes_nvidia.py --redo          # re-generate already-keyframed shots
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent          # d:\AI\MaMaZainab
ADMIN_UI = ROOT / "11_AdminUI"
ENV_FILE = ADMIN_UI / ".env.local"
PACK_JSON = ADMIN_UI / "data" / "prompt-pack.json"
OUT_DIR = ADMIN_UI / "public" / "uploads" / "keyframes"

# ── NVIDIA API ─────────────────────────────────────────────────────────────────
CLOUD_BASE = "https://ai.api.nvidia.com/v1/genai"
MODELS = {
    "schnell": "black-forest-labs/flux.1-schnell",
    "dev":     "black-forest-labs/flux.1-dev",
}
WIDTH, HEIGHT = 1344, 768   # 16:9, confirmed working on Schnell + Dev


# ── Helpers ───────────────────────────────────────────────────────────────────
def load_env_key() -> str:
    """Extract NVIDIA_API_KEY from .env.local (never hard-coded)."""
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("NVIDIA_API_KEY=") and not line.startswith("#"):
            val = line.split("=", 1)[1].strip().strip('"').strip("'")
            if val:
                return val
    sys.exit("❌  NVIDIA_API_KEY not found in 11_AdminUI/.env.local")


def clean_prompt(raw: str) -> str:
    """Mirror the cleanPrompt() in lib/nvidia/client.ts."""
    p = raw
    # Remove [REF: ...] image reference tags
    p = re.sub(r"\[REF:[^\]]*\]", "", p, flags=re.IGNORECASE)
    # Remove [TAG: ...] and [TAG] bracket markers
    p = re.sub(r"\[[A-Z][A-Z _]*(?::[^\]]*)?\]", "", p, flags=re.IGNORECASE)
    # Strip cinematography terms that trip the content filter
    p = re.sub(r"\b(shot on |ARRI Alexa \d+|anamorphic \d+:\d+|cinematic color grade|film grain)\b", "", p, flags=re.IGNORECASE)
    # Neutral substitutions
    p = re.sub(r"\bdystopian\b", "futuristic", p, flags=re.IGNORECASE)
    p = re.sub(r"\bdramatic mood\b", "moody atmosphere", p, flags=re.IGNORECASE)
    # Tidy up
    p = re.sub(r",\s*,", ",", p)
    p = re.sub(r"  +", " ", p)
    p = re.sub(r"\n{3,}", "\n\n", p)
    return p.strip()


def call_nvidia(prompt: str, model_id: str, api_key: str) -> tuple[bytes, int]:
    """
    POST to NVIDIA API Catalog, return (png_bytes, seed).
    Retries once on 5xx.
    """
    model_path = "/".join(urllib.request.quote(seg) for seg in model_id.split("/"))
    url = f"{CLOUD_BASE}/{model_path}"
    payload = json.dumps({
        "prompt": prompt,
        "width": WIDTH,
        "height": HEIGHT,
    }).encode()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    def attempt() -> dict:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return json.loads(resp.read())

    # Retry once on 5xx
    try:
        data = attempt()
    except urllib.error.HTTPError as e:
        if e.code >= 500:
            print(f"  ⚠  {e.code} - retrying in 3 s…")
            time.sleep(3)
            data = attempt()
        else:
            body = e.read().decode(errors="replace")
            sys.exit(f"❌  NVIDIA API error {e.code}: {body}")

    art = data.get("artifacts", [{}])[0]
    finish = art.get("finishReason", "SUCCESS")
    if finish != "SUCCESS":
        raise RuntimeError(f"CONTENT_FILTERED - {finish}")
    image_b64: str = art.get("base64") or data.get("image") or data.get("b64_json", "")
    if not image_b64:
        raise RuntimeError(f"Unexpected response shape: {list(data.keys())}")
    return base64.b64decode(image_b64), int(art.get("seed", 0))


# ── Flatten shots from prompt-pack.json ───────────────────────────────────────
def load_shots(pack: dict) -> list[dict]:
    """Return flat list of (scene_idx, shot_idx, shot) references."""
    out = []
    for si, scene in enumerate(pack.get("scenes", [])):
        for shi, shot in enumerate(scene.get("shots", [])):
            out.append((si, shi, shot))
    return out


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    ap = argparse.ArgumentParser(description="Batch NVIDIA keyframe generator")
    ap.add_argument("--dry-run", action="store_true", help="Print prompts, skip API calls")
    ap.add_argument("--shot",    type=str, default=None, help="Generate single shot e.g. 1.1")
    ap.add_argument("--start",   type=int, default=0,    help="Skip first N shots")
    ap.add_argument("--model",   choices=["schnell", "dev"], default="schnell")
    ap.add_argument("--redo",    action="store_true", help="Re-generate already-keyframed shots")
    args = ap.parse_args()

    model_id = MODELS[args.model]
    api_key = load_env_key() if not args.dry_run else "dry-run"

    pack = json.loads(PACK_JSON.read_text(encoding="utf-8"))
    flat = load_shots(pack)
    total = len(flat)

    # Filter
    if args.shot:
        flat = [(si, shi, s) for si, shi, s in flat if s.get("number") == args.shot]
        if not flat:
            sys.exit(f"❌  Shot {args.shot!r} not found in prompt-pack.json")
    elif args.start:
        flat = flat[args.start:]

    if not args.redo:
        flat = [(si, shi, s) for si, shi, s in flat if s.get("status") != "keyframed"]

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n=== Batch NVIDIA Keyframes ({'DRY RUN' if args.dry_run else model_id}) ===")
    print(f"    {len(flat)} shots to generate (of {total} total)\n")

    cost_per_shot = 0.003 if args.model == "schnell" else 0.040
    print(f"    Estimated cost: ${cost_per_shot * len(flat):.3f}  "
          f"({len(flat)} × ${cost_per_shot})\n")

    ok = fail = skip = 0
    for i, (si, shi, shot) in enumerate(flat, 1):
        num = shot.get("number", "?")
        sid = shot.get("id", "")
        image_prompt = shot.get("imagePrompt", "").strip()

        if not image_prompt:
            print(f"  [{i}/{len(flat)}] Shot {num} - ⚠  no imagePrompt, skipping")
            skip += 1
            continue

        cleaned = clean_prompt(image_prompt)
        fname = f"{num.replace('.', '_')}_{sid}.png"
        out_path = OUT_DIR / fname
        web_path = f"/uploads/keyframes/{fname}"

        print(f"  [{i}/{len(flat)}] Shot {num} - {shot.get('type', '')} ({shot.get('durationSec', '?')}s)")
        if args.dry_run:
            print(f"        PROMPT: {cleaned[:120]}…")
            ok += 1
            continue

        try:
            t0 = time.time()
            png_bytes, seed = call_nvidia(cleaned, model_id, api_key)
            elapsed = time.time() - t0
            out_path.write_bytes(png_bytes)
            # Update the shot in-place
            pack["scenes"][si]["shots"][shi]["keyframeUrl"] = web_path
            pack["scenes"][si]["shots"][shi]["keyframeSeed"] = seed
            pack["scenes"][si]["shots"][shi]["status"] = "keyframed"
            print(f"        ✓  {len(png_bytes)//1024}KB  seed={seed}  {elapsed:.1f}s → {web_path}")
            ok += 1
            # Save after each shot so progress survives interruption
            PACK_JSON.write_text(json.dumps(pack, indent=2, ensure_ascii=False), encoding="utf-8")
        except RuntimeError as e:
            print(f"        ✗  {e}")
            fail += 1
        except Exception as e:
            print(f"        ✗  unexpected: {e}")
            fail += 1

        # Polite rate-limit pause between shots
        if i < len(flat):
            time.sleep(1.0)

    print(f"\n  Done: {ok} generated, {fail} failed, {skip} skipped")
    if fail:
        print(f"  Re-run with --redo to retry failed shots.")


if __name__ == "__main__":
    main()
