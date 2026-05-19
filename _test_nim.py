import urllib.request, json, re

with open(r"11_AdminUI\.env.local") as f:
    env = dict(line.strip().split("=", 1) for line in f if "=" in line and not line.startswith("#"))

key = env.get("NVIDIA_API_KEY", "")
print(f"Key prefix: {key[:12]}...")

# Try Cosmos text-to-video
models = [
    "nvidia/cosmos-predict1-7b-video2world",
    "nvidia/cosmos-predict1-5b-video2world",
    "nvidia/cosmos-predict2-2b-video2world",
    "nvidia/cosmos-predict2-5b-video2world",
]

# Try both base URLs
bases = [
    "https://ai.api.nvidia.com/v1/genai",
    "https://integrate.api.nvidia.com/v1/genai",
]

for base in bases:
  for model in models:
    url = f"{base}/{model}"
    data = json.dumps({"prompt": "a restaurant kitchen scene", "seed": 42}).encode()
    req = urllib.request.Request(
        url, data=data,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            print(f"\n[{model}] STATUS: {r.status}")
            body = r.read().decode()
            # Show keys only (body may be huge base64)
            try:
                j = json.loads(body)
                print("Response keys:", list(j.keys()))
                for k, v in j.items():
                    if isinstance(v, str) and len(v) > 80:
                        print(f"  {k}: <{len(v)} chars>")
                    else:
                        print(f"  {k}: {v}")
            except Exception:
                print(body[:400])
            break
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[{model}] HTTP {e.code}: {body[:200]}")
    except Exception as ex:
        print(f"[{model}] ERR: {type(ex).__name__}: {str(ex)}")
