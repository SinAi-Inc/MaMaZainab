"""
Validate NVIDIA API key + image generation models.
Also checks for ComfyUI local availability.
"""
import urllib.request, json, sys, socket

with open(r"D:\AI\MaMaZainab\11_AdminUI\.env.local") as f:
    env = {}
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()

key = env.get("NVIDIA_API_KEY", "")
print(f"NVIDIA Key prefix: {key[:12]}...")
print()

# ── Test 1: Model listing ──
print("=" * 60)
print("TEST 1: NVIDIA API Catalog - model listing")
print("=" * 60)
base = "https://integrate.api.nvidia.com/v1"
req = urllib.request.Request(f"{base}/models", headers={"Authorization": f"Bearer {key}"}, method="GET")
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())
        ids = [m["id"] for m in data.get("data", [])]
        img_matches = [i for i in ids if any(w in i.lower() for w in ["flux", "sdxl", "stable-diffusion", "imagen"])]
        vid_matches = [i for i in ids if any(w in i.lower() for w in ["video", "cosmos", "wan", "motion", "animate", "veo", "svd"])]
        print(f"  Total models available: {len(ids)}")
        print(f"  Image-gen models: {img_matches}")
        print(f"  Video-gen models: {vid_matches}")
except Exception as ex:
    print(f"  ERROR: {type(ex).__name__}: {ex}")

# ── Test 2: Flux.1 Schnell (cheapest - $0.003/call) ──
print()
print("=" * 60)
print("TEST 2: Flux.1 Schnell - image generation ($0.003/call)")
print("=" * 60)
url = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell"
payload = json.dumps({"prompt": "a single red tomato on white plate, photorealistic", "width": 512, "height": 512}).encode()
req = urllib.request.Request(url, data=payload, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req, timeout=60) as r:
        resp = json.loads(r.read())
        if resp.get("artifacts"):
            art = resp["artifacts"][0]
            b64len = len(art.get("base64", ""))
            seed = art.get("seed", "?")
            status = art.get("finishReason", "?")
            print(f"  STATUS: SUCCESS")
            print(f"  Image size: {b64len} chars base64 (~{b64len * 3 // 4 // 1024} KB)")
            print(f"  Seed: {seed}, Finish: {status}")
        elif resp.get("image"):
            print(f"  STATUS: SUCCESS")
            print(f"  Image size: {len(resp['image'])} chars base64")
        else:
            print(f"  STATUS: UNEXPECTED RESPONSE")
            print(f"  Keys: {list(resp.keys())}")
except urllib.error.HTTPError as e:
    body = e.read().decode()[:300]
    print(f"  STATUS: FAILED (HTTP {e.code})")
    print(f"  Error: {body}")
except Exception as ex:
    print(f"  STATUS: FAILED")
    print(f"  Error: {type(ex).__name__}: {ex}")

# ── Test 3: Flux.1 Dev (higher quality - $0.04/call) ──
print()
print("=" * 60)
print("TEST 3: Flux.1 Dev - image generation ($0.04/call)")
print("=" * 60)
url = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev"
payload = json.dumps({"prompt": "a single red tomato on white plate, photorealistic", "width": 512, "height": 512}).encode()
req = urllib.request.Request(url, data=payload, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req, timeout=120) as r:
        resp = json.loads(r.read())
        if resp.get("artifacts"):
            art = resp["artifacts"][0]
            b64len = len(art.get("base64", ""))
            seed = art.get("seed", "?")
            status = art.get("finishReason", "?")
            print(f"  STATUS: SUCCESS")
            print(f"  Image size: {b64len} chars base64 (~{b64len * 3 // 4 // 1024} KB)")
            print(f"  Seed: {seed}, Finish: {status}")
        elif resp.get("image"):
            print(f"  STATUS: SUCCESS")
            print(f"  Image size: {len(resp['image'])} chars base64")
        else:
            print(f"  STATUS: UNEXPECTED RESPONSE")
            print(f"  Keys: {list(resp.keys())}")
except urllib.error.HTTPError as e:
    body = e.read().decode()[:300]
    print(f"  STATUS: FAILED (HTTP {e.code})")
    print(f"  Error: {body}")
except Exception as ex:
    print(f"  STATUS: FAILED")
    print(f"  Error: {type(ex).__name__}: {ex}")

# ── Test 4: ComfyUI local availability ──
print()
print("=" * 60)
print("TEST 4: ComfyUI local (FREE - $0/call)")
print("=" * 60)
comfy_url = env.get("COMFYUI_BASE_URL", "http://127.0.0.1:8188")
print(f"  Configured URL: {comfy_url}")
print(f"  Workflow: {env.get('COMFYUI_WORKFLOW', 'not set')}")
print(f"  Checkpoint: {env.get('COMFYUI_SDXL_CKPT', 'not set')}")
try:
    req = urllib.request.Request(f"{comfy_url}/system_stats", method="GET")
    with urllib.request.urlopen(req, timeout=5) as r:
        stats = json.loads(r.read())
        devices = stats.get("devices", [])
        print(f"  STATUS: RUNNING")
        for d in devices:
            print(f"    Device: {d.get('name','?')} | VRAM: {d.get('vram_total',0)//1024//1024} MB | Type: {d.get('type','?')}")
except urllib.error.URLError:
    print(f"  STATUS: NOT RUNNING (connection refused)")
    print(f"  → Start ComfyUI to get free keyframes")
except Exception as ex:
    print(f"  STATUS: ERROR ({type(ex).__name__}: {ex})")

# ── Test 5: NVIDIA NIM container ──
print()
print("=" * 60)
print("TEST 5: NVIDIA NIM container (for Flux.2 Klein)")
print("=" * 60)
nim_url = env.get("NVIDIA_NIM_BASE_URL", "")
if not nim_url or "YOUR_BREV" in nim_url:
    print(f"  STATUS: NOT CONFIGURED")
    print(f"  Current value: {nim_url}")
    print(f"  → Flux.2 Klein (nimOnly) unavailable")
else:
    print(f"  Configured URL: {nim_url}")
    try:
        req = urllib.request.Request(f"{nim_url}/v1/models", method="GET")
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            print(f"  STATUS: RUNNING - {len(data.get('data', []))} models")
    except Exception as ex:
        print(f"  STATUS: NOT REACHABLE ({type(ex).__name__}: {ex})")

# ── Summary ──
print()
print("=" * 60)
print("CAPABILITY SUMMARY FOR KEYFRAME GENERATION")
print("=" * 60)
print("""
┌──────────────────────┬────────────┬───────────────────────────────────┐
│ Provider             │ Cost/frame │ Status                            │
├──────────────────────┼────────────┼───────────────────────────────────┤
│ ComfyUI (local SDXL) │ $0.00      │ Check above                       │
│ NVIDIA Flux.1 Schnell│ $0.003     │ Check above                       │
│ NVIDIA Flux.1 Dev    │ $0.04      │ Check above                       │
│ NVIDIA Flux.2 Klein  │ $0.003     │ Requires NIM container            │
│ OpenAI DALL-E 3      │ $0.04-0.08 │ Requires separate API key + budget│
│ Midjourney v7        │ $0.05+     │ Manual (no API)                   │
└──────────────────────┴────────────┴───────────────────────────────────┘

KEYFRAME BUDGET ESTIMATE (revised screenplay - 10 scenes):
  ~40-50 keyframes needed (4-5 per scene avg.)
  
  ComfyUI local:      50 × $0.00  = $0.00 (if running)
  Flux.1 Schnell:     50 × $0.003 = $0.15
  Flux.1 Dev:         50 × $0.04  = $2.00
  OpenAI DALL-E 3:    50 × $0.08  = $4.00
  OpenAI gpt-image-1: 50 × $0.17  = $8.50

  → NVIDIA Flux is 20-50x cheaper than OpenAI for keyframes.
""")
