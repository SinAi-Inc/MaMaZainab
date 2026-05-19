#!/bin/bash
# =============================================================================
# MaMa Zainab — Complete LoRA Training (Brev/Paperspace VM Mode)
# =============================================================================
#
# Paste this entire script into your Jupyter terminal.
# It does EVERYTHING: setup, download, train, generate.
#
# PREREQUISITES:
#   - VM with CUDA + Python (Paperspace VM Mode provides this)
#   - HuggingFace token with FLUX.1 Dev access
#
# ESTIMATED TIME:
#   - Setup: ~10 min (git clone + model download)
#   - Training: ~12 min × 4 characters = ~48 min
#   - Generation: ~1 min per shot × 50 = ~50 min
#   - Total: ~2 hours @ $3.83/hr ≈ $7.66
#
# =============================================================================

set -euo pipefail

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MaMa Zainab — Character LoRA Training Pipeline"
echo "  GPU: $(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || echo 'unknown')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============ CONFIG ============
WORK_DIR=~/mamazainab_training
TOOLKIT_DIR=$WORK_DIR/ai-toolkit
MODEL_DIR=$WORK_DIR/models/flux-dev
DATASET_DIR=$WORK_DIR/datasets
OUTPUT_DIR=$WORK_DIR/output
REPO_DIR=$WORK_DIR/repo
KEYFRAMES_DIR=$WORK_DIR/keyframes

mkdir -p "$WORK_DIR" "$DATASET_DIR" "$OUTPUT_DIR" "$KEYFRAMES_DIR"

# ============ STEP 1: HuggingFace Login ============
echo "┌─────────────────────────────────────────┐"
echo "│  Step 1/6: HuggingFace Authentication    │"
echo "└─────────────────────────────────────────┘"

if ! command -v huggingface-cli &>/dev/null; then
  pip install -q huggingface_hub[cli]
fi

# Check if already logged in
if huggingface-cli whoami &>/dev/null; then
  echo "✅ Already logged into HuggingFace as: $(huggingface-cli whoami | head -1)"
else
  echo ""
  echo "⚠️  You need to login to HuggingFace to download FLUX.1 Dev"
  echo "   Get your token at: https://huggingface.co/settings/tokens"
  echo ""
  huggingface-cli login
fi

# ============ STEP 2: Clone repos + install deps ============
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  Step 2/6: Installing Dependencies       │"
echo "└─────────────────────────────────────────┘"

# Clone MaMaZainab repo for reference images
if [ ! -d "$REPO_DIR" ]; then
  echo "  📥 Cloning MaMaZainab repo..."
  git clone --depth 1 https://github.com/SinAi-Inc/MaMaZainab.git "$REPO_DIR"
else
  echo "  ✅ Repo already cloned"
fi

# Clone ai-toolkit
if [ ! -d "$TOOLKIT_DIR" ]; then
  echo "  📥 Cloning ai-toolkit..."
  git clone https://github.com/ostris/ai-toolkit.git "$TOOLKIT_DIR"
  cd "$TOOLKIT_DIR"
  git submodule update --init --recursive
else
  echo "  ✅ ai-toolkit already cloned"
  cd "$TOOLKIT_DIR"
fi

# Install Python deps
echo "  📦 Installing Python packages..."
pip install -q -r requirements.txt 2>/dev/null || true
pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cu121 2>/dev/null || true
pip install -q peft accelerate transformers diffusers[torch] safetensors pillow 2>/dev/null || true

echo "  ✅ Dependencies ready"

# ============ STEP 3: Download FLUX.1 Dev ============
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  Step 3/6: Downloading FLUX.1 Dev Model  │"
echo "└─────────────────────────────────────────┘"

if [ -d "$MODEL_DIR" ] && [ -f "$MODEL_DIR/flux1-dev.safetensors" -o -f "$MODEL_DIR/transformer/diffusion_pytorch_model.safetensors" ]; then
  echo "  ✅ Model already downloaded"
else
  echo "  📥 Downloading FLUX.1 Dev (~12GB)... this takes a few minutes."
  huggingface-cli download black-forest-labs/FLUX.1-dev --local-dir "$MODEL_DIR"
  echo "  ✅ Model downloaded"
fi

# ============ STEP 4: Prepare Training Datasets ============
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  Step 4/6: Preparing Character Datasets  │"
echo "└─────────────────────────────────────────┘"

# --- MaMa Zainab ---
CHAR="mama_zainab"
CHAR_DIR="$DATASET_DIR/$CHAR"
mkdir -p "$CHAR_DIR"
echo "  📂 $CHAR:"
COUNT=0
for IMG in \
  "$REPO_DIR/11_AdminUI/public/uploads/chars/L3SP6ixQDt.jpg" \
  "$REPO_DIR/02_Characters/MaMaZainabFinal.png" \
  "$REPO_DIR/02_Characters/MaMaZainab.jpg" \
  "$REPO_DIR/02_Characters/MaMaZainab.png" \
  "$REPO_DIR/02_Characters/MaMaYellowZainab.jpg"; do
  if [ -f "$IMG" ]; then
    EXT="${IMG##*.}"
    DEST="$CHAR_DIR/img_$(printf '%02d' $COUNT).$EXT"
    cp "$IMG" "$DEST"
    echo "mama_zainab, Egyptian woman in her late 50s, warm kind face, soft dark eyes, gentle smile lines, olive skin, cream headscarf, GREEN-base plaid apron with yellow stripes, gold hoop earrings" > "${DEST%.*}.txt"
    COUNT=$((COUNT + 1))
  fi
done
echo "     → $COUNT images"

# --- Wong Warrior ---
CHAR="wong_warrior"
CHAR_DIR="$DATASET_DIR/$CHAR"
mkdir -p "$CHAR_DIR"
echo "  📂 $CHAR:"
COUNT=0
for IMG in \
  "$REPO_DIR/11_AdminUI/public/uploads/chars/YEcQAWdIki.jpg" \
  "$REPO_DIR/02_Characters/WongHong.png" \
  "$REPO_DIR/02_Characters/Wong.jpg" \
  "$REPO_DIR/02_Characters/Wong.png" \
  "$REPO_DIR/02_Characters/WongWarrior.jpg" \
  "$REPO_DIR/02_Characters/WongCollage.png"; do
  if [ -f "$IMG" ]; then
    EXT="${IMG##*.}"
    DEST="$CHAR_DIR/img_$(printf '%02d' $COUNT).$EXT"
    cp "$IMG" "$DEST"
    echo "wong_warrior, East-Asian man in his 60s, salt-and-pepper hair tied back, weathered face with subtle scars, calm dangerous eyes, dark silken warrior robes, coiled dangerous stillness" > "${DEST%.*}.txt"
    COUNT=$((COUNT + 1))
  fi
done
echo "     → $COUNT images"

# --- Wong Banker ---
CHAR="wong_banker"
CHAR_DIR="$DATASET_DIR/$CHAR"
mkdir -p "$CHAR_DIR"
echo "  📂 $CHAR:"
COUNT=0
for IMG in \
  "$REPO_DIR/11_AdminUI/public/uploads/chars/hyoRbUUPTY.jpg" \
  "$REPO_DIR/02_Characters/IsolatedWong.png" \
  "$REPO_DIR/02_Characters/IsolatedWongAfter.jpg" \
  "$REPO_DIR/02_Characters/WongAfter.jpg" \
  "$REPO_DIR/02_Characters/WongBeforeAfter.jpg"; do
  if [ -f "$IMG" ]; then
    EXT="${IMG##*.}"
    DEST="$CHAR_DIR/img_$(printf '%02d' $COUNT).$EXT"
    cp "$IMG" "$DEST"
    echo "wong_banker, East-Asian man in his 60s, salt-and-pepper hair tied back, weathered face with subtle scars, calm warm eyes, crisp cream linen suit, dignified founder" > "${DEST%.*}.txt"
    COUNT=$((COUNT + 1))
  fi
done
echo "     → $COUNT images"

# --- ZuZu ---
CHAR="zuzu"
CHAR_DIR="$DATASET_DIR/$CHAR"
mkdir -p "$CHAR_DIR"
echo "  📂 $CHAR:"
COUNT=0
for IMG in \
  "$REPO_DIR/02_Characters/ZuZu.PNG" \
  "$REPO_DIR/02_Characters/ZuZuThumbsUp.jpg" \
  "$REPO_DIR/02_Characters/ZuZuThumbsUp.PNG" \
  "$REPO_DIR/11_AdminUI/public/uploads/chars/zudXHgBfRi.jpg"; do
  if [ -f "$IMG" ]; then
    EXT="${IMG##*.}"
    DEST="$CHAR_DIR/img_$(printf '%02d' $COUNT).$EXT"
    cp "$IMG" "$DEST"
    echo "zuzu, plump healthy white domestic goose, fluffy clean feathers, expressive amber eyes, vivid orange beak and feet, tiny green plaid ribbon around neck" > "${DEST%.*}.txt"
    COUNT=$((COUNT + 1))
  fi
done
echo "     → $COUNT images"

echo ""
echo "  ✅ All datasets prepared"

# ============ STEP 5: Generate Training Configs + Train ============
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  Step 5/6: Training LoRAs (4 chars)      │"
echo "└─────────────────────────────────────────┘"
echo ""

CHARS=(mama_zainab wong_warrior wong_banker zuzu)
TRIGGERS=(mama_zainab wong_warrior wong_banker zuzu)
CAPTIONS=(
  "mama_zainab, Egyptian woman in her late 50s, warm kind face, soft dark eyes, gentle smile lines, olive skin, cream headscarf"
  "wong_warrior, East-Asian man in his 60s, salt-and-pepper hair tied back, weathered face, dark silken warrior robes"
  "wong_banker, East-Asian man in his 60s, salt-and-pepper hair tied back, calm warm eyes, crisp cream linen suit"
  "zuzu, plump healthy white domestic goose, fluffy clean feathers, expressive amber eyes, orange beak"
)

cd "$TOOLKIT_DIR"
mkdir -p config

for i in "${!CHARS[@]}"; do
  CHAR="${CHARS[$i]}"
  TRIGGER="${TRIGGERS[$i]}"
  CAPTION="${CAPTIONS[$i]}"

  echo "━━━ Training: $CHAR (${TRIGGER}) ━━━"
  echo "  Start: $(date '+%H:%M:%S')"

  # Write config
  cat > "config/${CHAR}_train.yaml" << YAML
---
job: extension
config:
  name: "${CHAR}_flux_lora"
  process:
    - type: sd_trainer
      training_folder: "${OUTPUT_DIR}/${CHAR}"
      device: cuda:0
      trigger_word: "${TRIGGER}"
      network:
        type: lora
        linear: 16
        linear_alpha: 16
      save:
        dtype: float16
        save_every: 250
        max_step_saves_to_keep: 2
      datasets:
        - folder_path: "${DATASET_DIR}/${CHAR}"
          caption_ext: txt
          caption_dropout_rate: 0.05
          shuffle_tokens: false
          cache_latents_to_disk: true
          resolution:
            - 512
            - 768
            - 1024
      train:
        batch_size: 1
        steps: 1000
        gradient_accumulation_steps: 1
        train_unet: true
        train_text_encoder: false
        gradient_checkpointing: true
        noise_scheduler: flowmatch
        optimizer: adamw8bit
        lr: 4e-4
        ema_decay: 0.99
        dtype: bf16
      model:
        name_or_path: "${MODEL_DIR}"
        is_flux: true
        quantize: true
      sample:
        sampler: flowmatch
        sample_every: 250
        width: 1024
        height: 1024
        prompts:
          - "${CAPTION}, standing in a warm kitchen, golden light, portrait"
          - "${CAPTION}, cinematic shot, shallow depth of field"
meta:
  name: "[MaMa Zainab] ${CHAR}"
  version: "1.0"
YAML

  # Run training
  python run.py "config/${CHAR}_train.yaml"

  # Copy final weights
  FINAL=$(find "$OUTPUT_DIR/$CHAR" -name "*.safetensors" | sort | tail -1)
  if [ -n "$FINAL" ] && [ -f "$FINAL" ]; then
    cp "$FINAL" "$OUTPUT_DIR/${CHAR}.safetensors"
    SIZE=$(du -h "$OUTPUT_DIR/${CHAR}.safetensors" | cut -f1)
    echo "  ✅ Done: ${CHAR}.safetensors ($SIZE)"
  else
    echo "  ❌ No weights produced for $CHAR"
  fi
  echo "  End: $(date '+%H:%M:%S')"
  echo ""
done

# ============ STEP 6: Generate Keyframes with diffusers ============
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  Step 6/6: Generating Keyframes          │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "  Keyframe generation will be done via a Python script."
echo "  Creating generator..."

cat > "$WORK_DIR/generate_keyframes.py" << 'PYTHON'
#!/usr/bin/env python3
"""Generate keyframes using FLUX + trained LoRAs via diffusers."""
import json, os, sys, time
from pathlib import Path

import torch
from diffusers import FluxPipeline
from safetensors.torch import load_file

WORK_DIR = Path.home() / "mamazainab_training"
MODEL_DIR = WORK_DIR / "models" / "flux-dev"
OUTPUT_DIR = WORK_DIR / "output"
KEYFRAMES_DIR = WORK_DIR / "keyframes"
REPO_DIR = WORK_DIR / "repo"
VIDEOS_JSON = REPO_DIR / "11_AdminUI" / "data" / "videos.json"

WIDTH, HEIGHT = 1344, 768
STEPS = 28
GUIDANCE = 3.5

# Load pipeline
print("  Loading FLUX.1 Dev pipeline...")
pipe = FluxPipeline.from_pretrained(
    str(MODEL_DIR),
    torch_dtype=torch.bfloat16,
)
pipe.enable_model_cpu_offload()
print("  ✅ Pipeline loaded")

# Load LoRA weights
LORA_MAP = {}
for char_id in ["mama_zainab", "wong_warrior", "wong_banker", "zuzu"]:
    lora_path = OUTPUT_DIR / f"{char_id}.safetensors"
    if lora_path.exists():
        LORA_MAP[char_id] = str(lora_path)
        print(f"  ✅ LoRA loaded: {char_id}")
    else:
        print(f"  ⚠️  LoRA missing: {char_id}")

# Load shots
with open(VIDEOS_JSON) as f:
    data = json.load(f)

shots = data.get("shots", [])
print(f"\n  Generating keyframes for {len(shots)} shots...\n")

import re

def process_prompt(prompt):
    """Replace <lora:X> tags with trigger words and collect LoRA paths."""
    lora_paths = []
    def replacer(match):
        lora_id = match.group(1)
        if lora_id in LORA_MAP:
            lora_paths.append(LORA_MAP[lora_id])
        return lora_id  # Replace tag with trigger word
    clean = re.sub(r'<lora:([^>]+)>', replacer, prompt)
    return clean, lora_paths

generated = 0
for i, shot in enumerate(shots):
    prompt = shot.get("prompt", shot.get("description", ""))
    if not prompt:
        continue

    clean_prompt, lora_paths = process_prompt(prompt)
    shot_num = shot.get("number", f"{i}")

    print(f"  [{i+1}/{len(shots)}] Shot {shot_num}", end="")

    # Load LoRAs for this shot
    if lora_paths:
        for lp in lora_paths:
            pipe.load_lora_weights(lp)
        print(f" [LoRA: {len(lora_paths)}]")
    else:
        print(" [no LoRA]")

    try:
        seed = shot.get("keyframeSeed", 0) or (i * 12345 + 42)
        generator = torch.Generator("cpu").manual_seed(seed)

        image = pipe(
            prompt=clean_prompt,
            width=WIDTH,
            height=HEIGHT,
            num_inference_steps=STEPS,
            guidance_scale=GUIDANCE,
            generator=generator,
        ).images[0]

        # Save
        filename = f"lora_{shot_num.replace('.', '_')}_{seed}.jpg"
        save_path = KEYFRAMES_DIR / filename
        image.save(str(save_path), quality=92)

        # Update shot data
        shot["keyframeUrl"] = f"/uploads/generations/{filename}"
        shot["keyframeSeed"] = seed
        shot["keyframeApprovedAt"] = ""

        size_kb = save_path.stat().st_size / 1024
        print(f"    ✅ {filename} ({size_kb:.0f}KB)")
        generated += 1

    except Exception as e:
        print(f"    ❌ {str(e)[:100]}")

    # Unload LoRAs for next shot
    if lora_paths:
        pipe.unload_lora_weights()

    # Save progress every 10
    if generated % 10 == 0 and generated > 0:
        with open(VIDEOS_JSON, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

# Final save
with open(VIDEOS_JSON, 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n  ━━━ Done! Generated {generated}/{len(shots)} keyframes ━━━")
print(f"  Output: {KEYFRAMES_DIR}")
print(f"  Updated: {VIDEOS_JSON}")
PYTHON

echo "  ✅ Generator script created"
echo ""
echo "  Running keyframe generation..."
python "$WORK_DIR/generate_keyframes.py"

# ============ FINAL SUMMARY ============
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉 ALL DONE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  LoRA weights:"
for CHAR in mama_zainab wong_warrior wong_banker zuzu; do
  if [ -f "$OUTPUT_DIR/${CHAR}.safetensors" ]; then
    SIZE=$(du -h "$OUTPUT_DIR/${CHAR}.safetensors" | cut -f1)
    echo "    ✅ ${CHAR}.safetensors ($SIZE)"
  fi
done
echo ""
echo "  Keyframes: $(ls $KEYFRAMES_DIR/*.jpg 2>/dev/null | wc -l) images in $KEYFRAMES_DIR/"
echo ""
echo "  📋 NEXT: Download the results to your local machine:"
echo "     scp -r user@<instance>:~/mamazainab_training/output/*.safetensors ."
echo "     scp -r user@<instance>:~/mamazainab_training/keyframes/ ."
echo ""
echo "  Then copy keyframes to: 11_AdminUI/public/uploads/generations/"
echo "  And run locally: npx tsx _tools/rebuild_shots_from_script.mts"
echo ""
