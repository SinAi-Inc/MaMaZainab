import urllib.request, json

with open(r"D:\AI\MaMaZainab\11_AdminUI\.env.local") as f:
    env = {}
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()

key = env.get("NVIDIA_API_KEY", "")
print(f"Key: {key[:12]}...")

# Try OpenAI-compat models list
for base in ["https://integrate.api.nvidia.com/v1", "https://ai.api.nvidia.com/v1"]:
    req = urllib.request.Request(
        f"{base}/models",
        headers={"Authorization": f"Bearer {key}"},
        method="GET"
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read())
            ids = [m["id"] for m in data.get("data", [])]
            matches = [i for i in ids if any(w in i.lower() for w in ["video", "cosmos", "wan", "motion", "animate"])]
            print(f"[{base}] {len(ids)} models, video-related: {matches}")
    except urllib.error.HTTPError as e:
        print(f"[{base}] HTTP {e.code}: {e.read().decode()[:120]}")
    except Exception as ex:
        print(f"[{base}] {type(ex).__name__}: {ex}")
