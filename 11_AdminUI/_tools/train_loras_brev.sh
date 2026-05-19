#!/bin/bash
# =============================================================================
# MaMa Zainab — Character LoRA Training on Brev (GPU Instance)
# =============================================================================
#
# This script runs on a Brev A100/L40S instance to train FLUX LoRAs
# for each brand character. It produces .safetensors files that can be:
#   1. Used with ComfyUI for keyframe generation
#   2. Uploaded to fal.ai/HuggingFace for cloud generation
#
# PREREQUISITES (on Brev instance):
#   - NVIDIA GPU (A100 40GB+ or L40S recommended)
#   - CUDA 12.x
#   - Python 3.10+
#
# USAGE:
#   # SSH into your Brev instance, then:
#   bash train_loras_brev.sh
#
#   # Or train a single character:
#   bash train_loras_brev.sh mama_zainab
#
# OUTPUT:
#   ~/lora_output/<character_id>/
#     └── <character_id>.safetensors   (final LoRA weights)
#
# ESTIMATED TIME: ~12-15 min per character on A100-40GB
# =============================================================================

set -euo pipefail

# Config
REPO_DIR=~/MaMaZainab
TOOLKIT_DIR=~/ai-toolkit
OUTPUT_DIR=~/lora_output
DATASET_DIR=~/lora_datasets
SINGLE_CHAR="${1:-}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MaMa Zainab — LoRA Training Pipeline"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ---- Step 1: Setup ai-toolkit ----
if [ ! -d "$TOOLKIT_DIR" ]; then
  echo "📦 Cloning ai-toolkit..."
  git clone https://github.com/ostris/ai-toolkit.git "$TOOLKIT_DIR"
  cd "$TOOLKIT_DIR"
  git submodule update --init --recursive
  pip install -r requirements.txt
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
  pip install peft accelerate transformers diffusers safetensors pillow
else
  echo "✅ ai-toolkit already installed"
  cd "$TOOLKIT_DIR"
fi

# ---- Step 2: Download base model (FLUX.1 Dev) ----
MODEL_DIR=~/models/flux-dev
if [ ! -d "$MODEL_DIR" ]; then
  echo "📥 Downloading FLUX.1 Dev base model..."
  pip install huggingface_hub[cli]
  huggingface-cli download black-forest-labs/FLUX.1-dev --local-dir "$MODEL_DIR"
else
  echo "✅ FLUX.1 Dev model already cached"
fi

# ---- Step 3: Prepare datasets ----
echo ""
echo "📁 Preparing character datasets..."
mkdir -p "$DATASET_DIR" "$OUTPUT_DIR"

# Clone/update the repo to get reference images
if [ ! -d "$REPO_DIR" ]; then
  echo "  Cloning MaMaZainab repo for reference images..."
  git clone https://github.com/SinAi-Inc/MaMaZainab.git "$REPO_DIR"
else
  cd "$REPO_DIR" && git pull && cd -
fi

# Character definitions
declare -A CHAR_TRIGGERS
declare -A CHAR_CAPTIONS
declare -A CHAR_IMAGES

CHAR_TRIGGERS[mama_zainab]="mama_zainab"
CHAR_CAPTIONS[mama_zainab]="mama_zainab, Egyptian woman in her late 50s, warm kind face, soft dark eyes, gentle smile lines, olive skin, cream headscarf, GREEN-base plaid apron with yellow stripes, gold hoop earrings"
CHAR_IMAGES[mama_zainab]="
  $REPO_DIR/11_AdminUI/public/uploads/chars/L3SP6ixQDt.jpg
  $REPO_DIR/02_Characters/MaMaZainabFinal.png
  $REPO_DIR/02_Characters/MaMaZainab.jpg
  $REPO_DIR/02_Characters/MaMaZainab.png
  $REPO_DIR/02_Characters/MaMaYellowZainab.jpg
"

CHAR_TRIGGERS[wong_warrior]="wong_warrior"
CHAR_CAPTIONS[wong_warrior]="wong_warrior, East-Asian man in his 60s, salt-and-pepper hair tied back, weathered face with subtle scars, calm dangerous eyes, dark silken warrior robes"
CHAR_IMAGES[wong_warrior]="
  $REPO_DIR/11_AdminUI/public/uploads/chars/YEcQAWdIki.jpg
  $REPO_DIR/02_Characters/WongHong.png
  $REPO_DIR/02_Characters/Wong.jpg
  $REPO_DIR/02_Characters/Wong.png
  $REPO_DIR/02_Characters/WongWarrior.jpg
  $REPO_DIR/02_Characters/WongCollage.png
"

CHAR_TRIGGERS[wong_banker]="wong_banker"
CHAR_CAPTIONS[wong_banker]="wong_banker, East-Asian man in his 60s, salt-and-pepper hair tied back, weathered face with subtle scars, calm warm eyes, crisp cream linen suit, dignified founder"
CHAR_IMAGES[wong_banker]="
  $REPO_DIR/11_AdminUI/public/uploads/chars/hyoRbUUPTY.jpg
  $REPO_DIR/02_Characters/IsolatedWong.png
  $REPO_DIR/02_Characters/IsolatedWongAfter.jpg
  $REPO_DIR/02_Characters/WongAfter.jpg
  $REPO_DIR/02_Characters/WongBeforeAfter.jpg
"

CHAR_TRIGGERS[zuzu]="zuzu"
CHAR_CAPTIONS[zuzu]="zuzu, plump healthy white domestic goose, fluffy clean feathers, expressive amber eyes, vivid orange beak and feet, tiny green plaid ribbon around neck"
CHAR_IMAGES[zuzu]="
  $REPO_DIR/02_Characters/ZuZu.PNG
  $REPO_DIR/02_Characters/ZuZuThumbsUp.jpg
  $REPO_DIR/02_Characters/ZuZuThumbsUp.PNG
  $REPO_DIR/11_AdminUI/public/uploads/chars/zudXHgBfRi.jpg
"

# Characters to train
if [ -n "$SINGLE_CHAR" ]; then
  CHARS=("$SINGLE_CHAR")
else
  CHARS=(mama_zainab wong_warrior wong_banker zuzu)
fi

# ---- Step 4: Create dataset folders + caption files ----
for CHAR in "${CHARS[@]}"; do
  CHAR_DIR="$DATASET_DIR/$CHAR"
  mkdir -p "$CHAR_DIR"

  echo "  📂 $CHAR:"
  COUNT=0
  for IMG in ${CHAR_IMAGES[$CHAR]}; do
    if [ -f "$IMG" ]; then
      # Copy image to dataset folder
      EXT="${IMG##*.}"
      DEST="$CHAR_DIR/img_$(printf '%02d' $COUNT).$EXT"
      cp "$IMG" "$DEST"
      # Write caption file (same name, .txt extension)
      CAPTION_FILE="${DEST%.*}.txt"
      echo "${CHAR_CAPTIONS[$CHAR]}" > "$CAPTION_FILE"
      COUNT=$((COUNT + 1))
    fi
  done
  echo "     → $COUNT images prepared"
done

# ---- Step 5: Generate training configs ----
echo ""
echo "⚙️  Generating training configs..."

for CHAR in "${CHARS[@]}"; do
  CONFIG_FILE="$TOOLKIT_DIR/config/${CHAR}_train.yaml"
  cat > "$CONFIG_FILE" << EOF
---
job: extension
config:
  name: "${CHAR}_flux_lora"
  process:
    - type: sd_trainer
      training_folder: "${OUTPUT_DIR}/${CHAR}"
      device: cuda:0
      trigger_word: "${CHAR_TRIGGERS[$CHAR]}"
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
          - "${CHAR_CAPTIONS[$CHAR]}, standing in a warm kitchen, golden light"
          - "${CHAR_CAPTIONS[$CHAR]}, portrait shot, soft studio lighting"
meta:
  name: "[MaMa Zainab] ${CHAR}"
  version: "1.0"
EOF
  echo "  ✅ Config: config/${CHAR}_train.yaml"
done

# ---- Step 6: Run training ----
echo ""
echo "🚀 Starting training..."
echo ""

for CHAR in "${CHARS[@]}"; do
  echo "━━━ Training: $CHAR ━━━"
  echo "  Start: $(date)"

  cd "$TOOLKIT_DIR"
  python run.py "config/${CHAR}_train.yaml"

  # Find the final .safetensors
  FINAL=$(find "$OUTPUT_DIR/$CHAR" -name "*.safetensors" | sort | tail -1)
  if [ -n "$FINAL" ]; then
    # Copy to a clean name
    cp "$FINAL" "$OUTPUT_DIR/${CHAR}.safetensors"
    echo "  ✅ Done: $OUTPUT_DIR/${CHAR}.safetensors"
    echo "  End: $(date)"
  else
    echo "  ❌ No .safetensors found for $CHAR"
  fi
  echo ""
done

# ---- Step 7: Summary ----
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Training Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Output files:"
for CHAR in "${CHARS[@]}"; do
  if [ -f "$OUTPUT_DIR/${CHAR}.safetensors" ]; then
    SIZE=$(du -h "$OUTPUT_DIR/${CHAR}.safetensors" | cut -f1)
    echo "    ✅ ${CHAR}.safetensors ($SIZE)"
  else
    echo "    ❌ ${CHAR}.safetensors (missing)"
  fi
done
echo ""
echo "  Next steps:"
echo "    1. Copy .safetensors files to your ComfyUI models/loras/ folder"
echo "    2. Or upload to HuggingFace/fal.ai for cloud generation"
echo "    3. Run: npx tsx _tools/batch_keyframes_lora.mts"
echo ""
