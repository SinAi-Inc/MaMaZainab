"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Sparkles, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { recordGeneration } from "@/lib/generations/actions";
import type { Character } from "@/lib/characters/schema";
import {
  buildAnchorsFromCharacters,
  SCENE_CONTEXTS,
  assemblePrompt,
  getAnchorByValue,
  getSceneByValue,
} from "@/lib/ai/brand-bible";
import { PresetPicker } from "./preset-picker";

/* ---- Video models (NVIDIA API Catalog) ---- */
type VideoModel = {
  id: string;
  label: string;
  vendor: string;
};

const VIDEO_MODELS: VideoModel[] = [
  { id: "stabilityai/stable-video-diffusion", label: "Stable Video Diffusion", vendor: "Stability AI" },
];

const ASPECTS = ["16:9", "9:16", "1:1", "2.39:1", "4:3"];
const DURATIONS = [4, 5, 6, 8, 10, 15];

const STYLE_PRESETS = [
  "Cinematic — ARRI Alexa 35, anamorphic, warm Mediterranean highlights + cool teal shadows",
  "Food photography — overhead, soft diffused light, shallow depth of field",
  "Street documentary — handheld, natural light, 24fps",
  "Animated — bold outlines, flat color, smooth motion",
  "Product showcase — turntable, studio lighting, white cyclorama",
];

export function VideoGenTab({ characters }: { characters: Character[] }) {
  const characterAnchors = useMemo(
    () => buildAnchorsFromCharacters(characters),
    [characters],
  );
  const [model, setModel] = useState(VIDEO_MODELS[0].id);
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState("");
  const [anchorValue, setAnchorValue] = useState("");
  const [sceneValue, setSceneValue] = useState("");
  const [includeBrand, setIncludeBrand] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [resultVideo, setResultVideo] = useState<string | null>(null);

  const selectedAnchor = getAnchorByValue(anchorValue, characterAnchors);
  const selectedScene = getSceneByValue(sceneValue);

  function buildFullPrompt(): string {
    const assembled = assemblePrompt({
      sceneContext: selectedScene,
      characterAnchor: selectedAnchor,
      userPrompt: prompt,
      includePalette: includeBrand,
      isVideo: true,
    });

    // Prepend style preset if set
    const withStyle = stylePreset
      ? `Style: ${stylePreset}\n\n${assembled}`
      : assembled;

    if (!withStyle.trim()) return "";

    // Append technical metadata
    return `${withStyle}\n\nDuration: ${duration}s | Aspect: ${aspect} | Model: ${VIDEO_MODELS.find((m) => m.id === model)?.label ?? model}`;
  }

  function handleCopy() {
    const full = buildFullPrompt();
    if (!full.trim()) {
      toast.error("Write a prompt first");
      return;
    }
    navigator.clipboard.writeText(full);
    setCopied(true);
    toast.success("Prompt copied — paste into your generation tool");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerate() {
    const full = buildFullPrompt();
    if (!full.trim()) {
      toast.error("Write a prompt first");
      return;
    }
    setGenerating(true);
    setJobStatus(null);
    setResultVideo(null);
    const startTime = Date.now();
    try {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: full, aspect, duration }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.video) {
        setResultVideo(data.video);
        toast.success("Video generated!");
        recordGeneration({
          type: "video",
          model,
          prompt: full,
          characterAnchor: anchorValue,
          sceneContext: sceneValue,
          aspect,
          duration,
          stylePreset,
          status: "completed",
          elapsedMs: Date.now() - startTime,
          base64Output: data.video,
        }).catch(() => {});
      } else if (data.reqId) {
        setJobStatus(`Job submitted: ${data.reqId}\nPolling for completion...`);
        toast.success("Video job submitted — check back shortly");
        // Record as pending — we'll update when polling completes
        recordGeneration({
          type: "video",
          model,
          prompt: full,
          characterAnchor: anchorValue,
          sceneContext: sceneValue,
          aspect,
          duration,
          stylePreset,
          status: "pending",
          elapsedMs: Date.now() - startTime,
        }).catch(() => {});
        pollForResult(data.reqId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
      recordGeneration({
        type: "video",
        model,
        prompt: full,
        characterAnchor: anchorValue,
        sceneContext: sceneValue,
        aspect,
        duration,
        stylePreset,
        status: "failed",
        error: msg,
        elapsedMs: Date.now() - startTime,
      }).catch(() => {});
    } finally {
      setGenerating(false);
    }
  }

  async function pollForResult(reqId: string) {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetch(`/api/generate/video/${reqId}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === "completed" && data.video) {
          setResultVideo(data.video);
          setJobStatus(null);
          toast.success("Video ready!");
          return;
        }
        if (data.status === "failed") {
          setJobStatus("Generation failed.");
          toast.error("Video generation failed");
          return;
        }
        setJobStatus(`Status: ${data.status} (attempt ${i + 1}/${maxAttempts})`);
      } catch {
        // continue polling
      }
    }
    setJobStatus("Timed out waiting for result.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Left: prompt builder */}
      <div className="space-y-4">
        <PresetPicker
          mode="video"
          anchors={characterAnchors}
          onLoad={(p) => {
            setPrompt(p.prompt);
            setAspect(p.aspect);
            setSceneValue(p.sceneValue);
            setAnchorValue(p.anchorValue);
            toast.success(`Loaded Shot ${p.shotNumber} — ${p.shotDescription}`);
          }}
        />
        {/* Model row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              aria-label="Video model"
              className="w-full text-sm border border-border-strong rounded-md px-2.5 py-2 bg-white"
            >
              {VIDEO_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.vendor}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
              Aspect Ratio
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ASPECTS.map((r) => (
                <button
                  key={r}
                  onClick={() => setAspect(r)}
                  className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                    aspect === r
                      ? "border-brand-green bg-brand-green/10 text-brand-green-deep font-medium"
                      : "border-border text-muted hover:border-brand-green/50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
            Duration (seconds)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  duration === d
                    ? "border-brand-green bg-brand-green/10 text-brand-green-deep font-medium"
                    : "border-border text-muted hover:border-brand-green/50"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Style preset */}
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
            Style Preset <span className="font-normal">(optional)</span>
          </label>
          <select
            value={stylePreset}
            onChange={(e) => setStylePreset(e.target.value)}
            aria-label="Style preset"
            className="w-full text-sm border border-border-strong rounded-md px-2.5 py-2 bg-white"
          >
            <option value="">— Custom / None —</option>
            {STYLE_PRESETS.map((s) => (
              <option key={s} value={s}>
                {s.split("—")[0].trim()}
              </option>
            ))}
          </select>
        </div>

        {/* Prompt textarea */}
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
            Prompt
          </label>
          <Textarea
            rows={5}
            placeholder="Describe the video shot — camera motion, subject, action, mood..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* Scene Context + Character Anchor row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
              Scene Context <span className="font-normal">(optional)</span>
            </label>
            <select
              value={sceneValue}
              onChange={(e) => setSceneValue(e.target.value)}
              aria-label="Scene context"
              className="w-full text-sm border border-border-strong rounded-md px-2.5 py-2 bg-white"
            >
              <option value="">— No Scene —</option>
              {SCENE_CONTEXTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {selectedScene && (
              <p className="text-[10px] text-muted mt-1">
                Mood: {selectedScene.mood}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
              Character Anchor
            </label>
            <select
              value={anchorValue}
              onChange={(e) => setAnchorValue(e.target.value)}
              aria-label="Character anchor"
              className="w-full text-sm border border-border-strong rounded-md px-2.5 py-2 bg-white"
            >
              <option value="">— None —</option>
              {characterAnchors.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            {selectedAnchor?.referenceImage && (
              <div className="mt-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAnchor.referenceImage}
                  alt={selectedAnchor.label}
                  className="size-10 rounded-md object-cover border border-border"
                />
                <span className="text-[10px] text-muted">
                  Reference — {selectedAnchor.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Brand toggle */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeBrand}
            onChange={(e) => setIncludeBrand(e.target.checked)}
            className="rounded border-border-strong"
          />
          Append brand palette & plaid context
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleCopy} className="flex-1" variant="outline">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied!" : "Copy Full Prompt"}
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !prompt.trim()}>
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generating ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>

      {/* Right: preview panel */}
      <Card className="h-fit">
        <CardBody className="space-y-3">
          {resultVideo ? (
            <>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Generated Video
              </h4>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={`data:video/mp4;base64,${resultVideo}`}
                controls
                className="w-full rounded-md border border-border"
              />
            </>
          ) : jobStatus ? (
            <>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Job Status
              </h4>
              <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-brand-ink bg-surface rounded-md p-3 border border-border">
                {jobStatus}
              </pre>
            </>
          ) : (
            <>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Prompt Preview
              </h4>
              <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-brand-ink bg-surface rounded-md p-3 max-h-96 overflow-y-auto border border-border">
                {buildFullPrompt() || "Your composed prompt will appear here..."}
              </pre>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Video className="size-3.5" />
                <span>
                  {VIDEO_MODELS.find((m) => m.id === model)?.label} · {aspect} · {duration}s
                </span>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
