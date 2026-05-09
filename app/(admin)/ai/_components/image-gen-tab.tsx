"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Copy, Check, Sparkles, ImageIcon, Loader2, Download, X } from "lucide-react";
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

/* ---- Image models (NVIDIA API Catalog) ---- */
type ImageModel = {
  id: string;
  label: string;
  vendor: string;
};

const IMAGE_MODELS: ImageModel[] = [
  { id: "black-forest-labs/flux.1-dev", label: "Flux.1 Dev", vendor: "Black Forest Labs" },
  { id: "black-forest-labs/flux_1-schnell", label: "Flux.1 Schnell", vendor: "Black Forest Labs" },
  { id: "stabilityai/stable-diffusion-3-medium", label: "SD 3 Medium", vendor: "Stability AI" },
  { id: "stabilityai/stable-diffusion-xl", label: "SDXL", vendor: "Stability AI" },
];

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:2", "2.39:1"];

export function ImageGenTab({ characters }: { characters: Character[] }) {
  const characterAnchors = useMemo(
    () => buildAnchorsFromCharacters(characters),
    [characters],
  );
  const [model, setModel] = useState(IMAGE_MODELS[0].id);
  const [aspect, setAspect] = useState("1:1");
  const [prompt, setPrompt] = useState("");
  const [anchorValue, setAnchorValue] = useState("");
  const [sceneValue, setSceneValue] = useState("");
  const [includeBrand, setIncludeBrand] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setElapsedMs(0);
    timerRef.current = setInterval(() => setElapsedMs((t) => t + 100), 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const selectedAnchor = getAnchorByValue(anchorValue, characterAnchors);
  const selectedScene = getSceneByValue(sceneValue);

  function buildFullPrompt(): string {
    const assembled = assemblePrompt({
      sceneContext: selectedScene,
      characterAnchor: selectedAnchor,
      userPrompt: prompt,
      includePalette: includeBrand,
      isVideo: false,
    });

    if (!assembled.trim()) return "";

    // Append technical metadata
    return `${assembled}\n\nAspect ratio: ${aspect} | Model: ${IMAGE_MODELS.find((m) => m.id === model)?.label ?? model}`;
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
    setResultImage(null);
    setError(null);
    startTimer();
    const startTime = Date.now();
    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: full, aspect }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResultImage(data.image);
      toast.success("Image generated!");
      // Record in history (fire-and-forget)
      recordGeneration({
        type: "image",
        model,
        prompt: full,
        characterAnchor: anchorValue,
        sceneContext: sceneValue,
        aspect,
        status: "completed",
        elapsedMs: Date.now() - startTime,
        base64Output: data.image,
      }).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      toast.error(msg);
      recordGeneration({
        type: "image",
        model,
        prompt: full,
        characterAnchor: anchorValue,
        sceneContext: sceneValue,
        aspect,
        status: "failed",
        error: msg,
        elapsedMs: Date.now() - startTime,
      }).catch(() => {});
    } finally {
      stopTimer();
      setGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Left: prompt builder */}
      <div className="space-y-4">
        {/* Model + Aspect row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              aria-label="Image model"
              className="w-full text-sm border border-border-strong rounded-md px-2.5 py-2 bg-white"
            >
              {IMAGE_MODELS.map((m) => (
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
              {ASPECT_RATIOS.map((r) => (
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
              Character Anchor <span className="font-normal">(optional)</span>
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

        {/* Prompt textarea */}
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
            Prompt
          </label>
          <Textarea
            rows={5}
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
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
          {resultImage ? (
            <>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Generated Image
              </h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${resultImage}`}
                alt="Generated"
                className="w-full rounded-md border border-border"
              />
              <div className="flex items-center gap-2 text-xs text-muted">
                <ImageIcon className="size-3.5" />
                <span>
                  {IMAGE_MODELS.find((m) => m.id === model)?.label} · {aspect}
                </span>
              </div>
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
                <ImageIcon className="size-3.5" />
                <span>
                  {IMAGE_MODELS.find((m) => m.id === model)?.label} · {aspect}
                  {selectedAnchor ? ` · ${selectedAnchor.label}` : ""}
                  {selectedScene ? ` · ${selectedScene.label}` : ""}
                </span>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
