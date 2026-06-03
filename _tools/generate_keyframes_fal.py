"""
Generate keyframes for all shots in videos.json using fal.ai FLUX-LoRA.

Pipeline:
  1. Upload 4 character LoRAs to fal storage (once, cached in .lora_urls.json).
  2. For each shot, extract <lora:NAME> tags from the prompt, swap to fal lora_url.
  3. Generate via fal-ai/flux-lora endpoint.
  4. Download PNG to 10_AI_Assets/keyframes/<shot_id>.png.
  5. Update videos.json with keyframeUrl + keyframeSeed.

Cost: ~$0.035/image × 50 shots ≈ $1.75
"""
from __future__ import annotations
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

import fal_client

ROOT = Path(r"D:\AI\MaMaZainab")
LORA_DIR = ROOT / "10_AI_Assets" / "loras"
KEYFRAME_DIR = ROOT / "10_AI_Assets" / "keyframes"
VIDEOS_JSON = ROOT / "11_AdminUI" / "data" / "videos.json"
LORA_URL_CACHE = ROOT / "10_AI_Assets" / ".lora_urls.json"
PROJECT_ID = "prj_brand_incorporation"

# Read FAL_KEY from .env.local
ENV_FILE = ROOT / "11_AdminUI" / ".env.local"
for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
    if line.startswith("FAL_KEY="):
        os.environ["FAL_KEY"] = line.split("=", 1)[1].strip()
        break

assert os.environ.get("FAL_KEY"), "FAL_KEY not found in .env.local"

CHARACTERS = ["mama_zainab", "wong_warrior", "wong_banker", "zuzu"]
LORA_TAG_RE = re.compile(r"<lora:([a-z_]+)>")


def upload_loras() -> dict[str, str]:
    """Upload each .safetensors to fal storage and cache URLs."""
    if LORA_URL_CACHE.exists():
        cached = json.loads(LORA_URL_CACHE.read_text())
        if all(c in cached for c in CHARACTERS):
            print(f"[loras] Using cached URLs from {LORA_URL_CACHE.name}")
            return cached
    urls = {}
    for name in CHARACTERS:
        path = LORA_DIR / f"{name}.safetensors"
        if not path.exists():
            raise FileNotFoundError(path)
        print(f"[loras] Uploading {name} ({path.stat().st_size / 1024**2:.0f} MB)...")
        urls[name] = fal_client.upload_file(str(path))
        print(f"        -> {urls[name]}")
    LORA_URL_CACHE.parent.mkdir(parents=True, exist_ok=True)
    LORA_URL_CACHE.write_text(json.dumps(urls, indent=2))
    return urls


def gen_shot(shot: dict, lora_urls: dict[str, str]) -> tuple[str, int] | None:
    """Generate one keyframe. Returns (local_filename, seed) or None on failure."""
    prompt = shot.get("prompt", "").strip()
    if not prompt:
        return None
    tags = LORA_TAG_RE.findall(prompt)
    clean_prompt = LORA_TAG_RE.sub("", prompt).replace("  ", " ").strip()
    loras = [{"path": lora_urls[t], "scale": 1.0} for t in tags if t in lora_urls]

    args = {
        "prompt": clean_prompt,
        "image_size": "landscape_16_9",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": False,
        "output_format": "png",
    }
    if loras:
        args["loras"] = loras

    try:
        result = fal_client.subscribe(
            "fal-ai/flux-lora",
            arguments=args,
            with_logs=False,
        )
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

    img = result["images"][0]
    seed = result.get("seed", 0)
    out_path = KEYFRAME_DIR / f"{shot['id']}.png"
    KEYFRAME_DIR.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(img["url"], out_path)
    return out_path.name, seed


def main():
    print("=" * 60)
    print("fal.ai keyframe generator - MaMa Zainab")
    print("=" * 60)

    lora_urls = upload_loras()
    print()

    data = json.loads(VIDEOS_JSON.read_text(encoding="utf-8"))
    shots = [s for s in data["shots"] if s.get("projectId") == PROJECT_ID]
    total = len(shots)
    print(f"[shots] {total} shots in project {PROJECT_ID}")

    # Skip mode: regenerate only missing unless --all
    force_all = "--all" in sys.argv
    only = None
    for arg in sys.argv[1:]:
        if arg.startswith("--only="):
            only = set(arg.split("=", 1)[1].split(","))

    success = 0
    skipped = 0
    failed = []

    for i, shot in enumerate(shots, 1):
        if only and shot["id"] not in only:
            continue
        out_path = KEYFRAME_DIR / f"{shot['id']}.png"
        if not force_all and out_path.exists() and shot.get("keyframeUrl"):
            skipped += 1
            continue
        tags = LORA_TAG_RE.findall(shot.get("prompt", ""))
        tag_str = ",".join(tags) if tags else "no-lora"
        print(f"[{i:>2}/{total}] {shot['number']:>4} {shot['id']} ({tag_str}) ...", end=" ", flush=True)
        t0 = time.time()
        result = gen_shot(shot, lora_urls)
        if result:
            fname, seed = result
            shot["keyframeUrl"] = f"/uploads/keyframes/{fname}"
            shot["keyframeSeed"] = seed
            shot["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
            success += 1
            print(f"OK ({time.time()-t0:.1f}s) seed={seed}")
            # Save incrementally so a crash doesn't lose progress
            VIDEOS_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        else:
            failed.append(shot["id"])
            print("FAIL")

    print()
    print("=" * 60)
    print(f"Done. Success: {success} | Skipped: {skipped} | Failed: {len(failed)}")
    if failed:
        print(f"Failed IDs: {failed}")
    print(f"Output dir: {KEYFRAME_DIR}")
    print(f"Estimated cost: ${success * 0.035:.2f}")


if __name__ == "__main__":
    main()
