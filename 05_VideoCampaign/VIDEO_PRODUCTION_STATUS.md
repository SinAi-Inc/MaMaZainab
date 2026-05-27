# Video Production Status - Brand Incorporation Film

> **Project:** Brand Incorporation - The Legend of Wong & MaMa Zainab (Full 10-Scene)  
> **Target runtime:** ~3:30 cinematic  
> **Aspect ratio:** 2.39:1 (anamorphic)  
> **Last updated:** 2026-05-25

---

## Current Phase: KEYFRAMES COMPLETE → VIDEO GENERATION READY

All 46 shots across 10 scenes have LoRA-generated keyframes. Zero video clips generated yet.

Deployment note: the keyframe PNGs are currently local runtime assets under
`11_AdminUI/public/uploads/keyframes/`. That folder is intentionally gitignored,
so production readiness requires uploading the approved keyframes to Supabase
Storage or another managed asset store before relying on their URLs in the live
Admin UI.

---

## Asset Inventory

### Keyframes (46/46 complete ✅)

All stored at `11_AdminUI/public/uploads/keyframes/` - naming: `{scene}_{shot}_shot_{id}.png`

| Scene | Shots | Files | Size Range |
|-------|-------|-------|-----------|
| 1 - Neon City Rooftop | 6 | 1_1 – 1_6 | 64–162 KB |
| 2 - Airport / Arrival Egypt | 5 | 2_1 – 2_5 | 137–183 KB |
| 3 - Street Market / First Taste | 5 | 3_1 – 3_5 | 89–162 KB |
| 4 - Ghost Appears / Revelation | 4 | 4_1 – 4_4 | 86–242 KB |
| 5 - Kitchen / Brand Genesis | 5 | 5_1 – 5_5 | 124–224 KB |
| 6 - ZuZu Introduction | 4 | 6_1 – 6_4 | 125–155 KB |
| 7 - Market Expansion / Montage | 6 | 7_1 – 7_6 | 102–207 KB |
| 8 - Community / Growth | 5 | 8_1 – 8_5 | 119–261 KB |
| 9 - Empire Established | 3 | 9_1 – 9_3 | 111–151 KB |
| 10 - Legacy / Closing | 3 | 10_1 – 10_3 | 96–151 KB |

### Additional keyframes (LoRA test generations, not mapped to shots)
11 extra PNGs (1.9–2.4 MB each) - higher-res experiments stored in same folder.

### Character LoRAs (4 safetensors)
Location: `10_AI_Assets/loras/`
- `mama_zainab.safetensors`
- `wong_banker.safetensors`
- `wong_warrior.safetensors`
- `zuzu.safetensors`

### Character Reference Images (10 files)
Location: `11_AdminUI/public/uploads/chars/`

### Generation History (55 images + 1 test video)
Location: `11_AdminUI/public/uploads/generations/`
- 54 `.jpg` image generations (LoRA + Flux test runs)
- 1 `bedrock_Q_OxLCfEYu.mp4` - Amazon Nova Reel test clip

### Prompt Pack (master data)
Location: `11_AdminUI/data/prompt-pack.json`  
Contains all 10 scenes / 46 shots with full `imagePrompt` + `videoPrompt` per shot.

### Storyboard Documents
- `05_VideoCampaign/STORYBOARD.md` - production stack + shot list + Veo prompt samples
- `05_VideoCampaign/prompt_pack.md` - human-readable prompt pack
- `05_VideoCampaign/prompt_pack.json` - machine prompt pack (legacy, pre-AdminUI)
- `04_Scripts/MaMa Zainab.md` - full master script (English)
- `04_Scripts/MaMa ZainabِArabic.md` - Arabic adaptation
- `04_Scripts/MaMa_Zainab_Keyframe_Storyboard.md` - keyframe-specific storyboard

---

## Video Provider Status

### Currently wired in AdminUI (`lib/video/providers/`)

| Provider | Model | Route | API Key Status |
|----------|-------|-------|---------------|
| **Runway** | Gen-4 | Direct API | ✅ `RUNWAY_API_KEY` configured |
| **fal.ai** | Kling 3.0, Veo 3.1, Pika 2.2, Luma, Wan | Hub gateway | ⚠️ `FAL_KEY` present but **funds exhausted** |
| **Amazon Bedrock** | Nova Reel | AWS SDK | ✅ `AWS_*` vars configured |
| **Local NIM** | Draft tier | localhost:8000 | ✅ Local only |
| **RunPod** | Wan 2.2 | Serverless | ❌ `RUNPOD_API_KEY` empty |

### Planned: Google Veo 3 (Direct / Vertex AI)
**Status:** Not yet implemented as a dedicated provider.  
Currently routes through fal.ai → `fal-ai/veo3`.  
To run Google Omni / Veo direct, need:
- Google AI Studio API key (`GOOGLE_API_KEY`) or
- Vertex AI service account + `GOOGLE_PROJECT_ID`

---

## Video Generation Plan - Google Veo 3 Test Run

### Why Veo 3 for this project:
1. Audio-native generation (dialogue + SFX baked in)
2. Strong emotional closeup performance (Scenes 4, 5, 6, 9)
3. High cinematic quality for wide/aerial shots

### Priority shots for test run (start with high-value frames):

| Priority | Shot | Type | Reason |
|----------|------|------|--------|
| 1 | 1.1 | Aerial wide | Hero opening shot - neon city descent |
| 2 | 4.1 | Close-up | Ghost appearance - emotional / supernatural |
| 3 | 5.1 | Medium | Kitchen founding - brand genesis moment |
| 4 | 2.1 | Wide | Egypt arrival - location establish |
| 5 | 7.1 | Tracking | Market montage - motion complexity test |
| 6 | 10.3 | Wide | Final logo reveal - brand stamp |

### What's needed to start:
1. ✅ Keyframes ready (img-to-video reference frames for all 46 shots)
2. ✅ Video prompts pre-built per shot (in `prompt-pack.json`)
3. ⚠️ Upload approved keyframes to durable storage and update AdminUI URLs
4. ⚠️ Google API provider implementation (new `lib/video/providers/google.ts`)
5. ⚠️ API key: `GOOGLE_API_KEY` or Vertex credentials
6. ✅ Recommendation engine already maps emotional shots → Veo

---

## Folder Map (quick reference)

```
MaMaZainab/
├── 04_Scripts/              ← Master scripts (EN + AR)
├── 05_VideoCampaign/        ← Storyboard + prompt packs + THIS STATUS FILE
├── 10_AI_Assets/loras/      ← 4 character LoRA safetensors
├── 11_AdminUI/
│   ├── data/prompt-pack.json       ← Master shot data (46 shots, prompts, keyframe URLs)
│   ├── lib/video/providers/        ← Provider implementations (runway, fal, bedrock, nim, runpod)
│   ├── lib/video/recommend.ts      ← AI model recommendation engine
│   ├── lib/videos/                 ← Studio domain (projects, scenes, shots, takes)
│   └── public/uploads/
│       ├── keyframes/              ← 46 shot keyframes + 11 test frames (PNG)
│       ├── chars/                  ← 10 character reference images
│       └── generations/            ← 55 generation outputs (history)
└── _source/                 ← Original brand source files (AI, PDF, photos)
```

---

## Next Steps

1. **Upload keyframes to managed storage** - Supabase Storage bucket or equivalent production asset store
2. **Update `prompt-pack.json` keyframe URLs** - replace local `/uploads/keyframes/*` paths with durable public or signed URLs
3. **Add Google Veo provider** - create `lib/video/providers/google.ts` implementing the VideoProvider interface using Google AI Studio / Vertex API
4. **Set `GOOGLE_API_KEY`** in `.env.local`
5. **Test run** - generate video clips for priority shots above
6. **Evaluate quality** - compare Veo outputs vs Runway / Bedrock test clip
7. **Batch generate** - once quality confirmed, run all 46 shots through optimal provider per recommendation engine
