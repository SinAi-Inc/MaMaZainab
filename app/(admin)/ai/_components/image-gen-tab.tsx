"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Copy, Check, Sparkles, ImageIcon, Loader2, Users } from "lucide-react";
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

const IMAGE_MODELS = [
  { id: "black-forest-labs/flux.1-dev", label: "Flux.1 Dev", vendor: "Black Forest Labs" },
  { id: "black-forest-labs/flux.1-schnell", label: "Flux.1 Schnell", vendor: "Black Forest Labs" },
] as const;

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:2", "2.39:1"];

export function ImageGenTab({ characters }: { characters: Character[] }) {
  const characterAnchors = useMemo(
    () => buildAnchorsFromCharacters(characters),
    [characters],
  );
  const [model, setModel] = useState<string>(IMAGE_MODELS[0].id);
  const [aspect, setAspect] = useState("1:1");
  const [prompt, setPrompt] = useState("");
  const [anchorValues, setAnchorValues] = useState<string[]>([]);
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

  const selectedAnchors = useMemo(
    () => anchorValues.map((v) => getAnchorByValue(v, characterAnchors)).filter(Boolean) as ReturnType<typeof getAnchorByValue>[],
    [anchorValues, characterAnchors],
  ) as NonNullable<ReturnType<typeof getAnchorByValue>>[];

  const selectedScene = getSceneByValue(sceneValue);

  function toggleAnchor(value: string) {
    setAnchorValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function buildFullPrompt(): string {
    const assembled = assemblePrompt({
      sceneContext: selectedScene,
      characterAnchors: selectedAnchors,
      userPrompt: prompt,
      includePalette: includeBrand,
      isVideo: false,
    });
    if (!assembled.trim()) return "";
    return `${assembled}\n\nAspect ratio: ${aspect} | Model: ${IMAGE_MODELS.find((m) => m.id === model)?.label ?? model}`;
  }

  function handleCopy() {
    const full = buildFullPrompt();
    if (!full.trim()) { toast.error("Write a prompt first"); return; }
    navigator.clipboard.writeText(full);
    setCopied(true);
    toast.success("Prompt copied");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerate() {
    const full = buildFullPrompt();
    if (!full.trim()) { toast.error("Write a prompt first"); return; }
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
      recordGeneration({
        type: "image",
        model,
        prompt: full,
        characterAnchor: anchorValues.join(","),
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
        characterAnchor: anchorValues.join(","),
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
      <div className="space-y-5">
        <PresetPicker
          mode="image"
          anchors={characterAnchors}
          onLoad={(p) => {
            setPrompt(p.prompt);
            setAspect(p.aspect);
            setSceneValue(p.sceneValue);
            setAnchorValues(p.anchorValue ? [p.anchorValue] : []);
            toast.success(`Loaded Shot ${p.shotNumber} — ${p.shotDescription}`);
          }}
        />

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
                <option key={m.id} value={m.id}>{m.label} — {m.vendor}</option>
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

        {/* Scene Context */}
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
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {selectedScene && (
            <p className="text-[10px] text-muted mt-1">
              Mood: {selectedScene.mood} · Suggested cast: {selectedScene.characters.join(", ") || "none"}
            </p>
          )}
        </div>

        {/* Character Anchors — multi-select with thumbnails */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Characters in Frame
            </label>
            <span className="flex items-center gap-1 text-[10px] text-muted border border-border rounded-full px-2 py-0.5">
              <Users className="size-3" />
              {anchorValues.length === 0 ? "none selected" : `${anchorValues.length} selected`}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {characterAnchors.map((anchor) => {
              const checked = anchorValues.includes(anchor.value);
              return (
                <button
                  key={anchor.value}
                  onClick={() => toggleAnchor(anchor.value)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all ${
                    checked
                      ? "border-brand-green bg-brand-green/8 ring-1 ring-brand-green/30"
                      : "border-border bg-surface hover:border-brand-green/40"
                  }`}
                >
                  {anchor.referenceImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={anchor.referenceImage}
                      alt={anchor.label}
                      className="size-9 rounded-md object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div className="size-9 rounded-md bg-surface-2 flex items-center justify-center shrink-0 border border-border">
                      <Users className="size-4 text-muted" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`text-xs font-medium leading-tight truncate ${checked ? "text-brand-green-deep" : ""}`}>
                      {anchor.label}
                    </p>
                    {checked && (
                      <p className="text-[9px] text-brand-green mt-0.5">✓ anchored</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {anchorValues.length > 1 && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
              Multi-character frame — Cast Rules will be injected automatically. Mama Zainab must be largest/centered.
            </p>
          )}
        </div>

        {/* Prompt textarea */}
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
            Director's Notes
          </label>
          <Textarea
            rows={4}
            placeholder="Describe shot composition, action, lighting, props..."
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
            {generating
              ? <><Loader2 className="size-4 animate-spin" /> {(elapsedMs / 1000).toFixed(1)}s</>
              : <><Sparkles className="size-4" /> Generate</>
            }
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
      </div>

      {/* Right: preview / result panel */}
      <Card className="h-fit sticky top-4">
        <CardBody className="space-y-3">
          {resultImage ? (
            <>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Generated</h4>
                <a
                  href={`data:image/jpeg;base64,${resultImage}`}
                  download={`mz-gen-${Date.now()}.jpg`}
                  className="text-xs text-brand-green hover:underline"
                >
                  Download
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${resultImage}`}
                alt="Generated"
                className="w-full rounded-md border border-border"
              />
              <div className="flex flex-wrap gap-1 text-[10px] text-muted">
                <span>{IMAGE_MODELS.find((m) => m.id === model)?.label}</span>
                <span>·</span>
                <span>{aspect}</span>
                {selectedAnchors.map((a) => (
                  <span key={a.value}>· {a.label}</span>
                ))}
              </div>
              <Button variant="outline" className="w-full text-xs" onClick={() => setResultImage(null)}>
                Back to prompt
              </Button>
            </>
          ) : (
            <>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Assembled Prompt
              </h4>
              {/* Selected character thumbnails */}
              {selectedAnchors.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedAnchors.map((a) => a.referenceImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={a.value}
                      src={a.referenceImage}
                      alt={a.label}
                      title={a.label}
                      className="size-12 rounded-md object-cover border border-brand-green/40"
                    />
                  ))}
                </div>
              )}
              <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-brand-ink bg-surface rounded-md p-3 max-h-80 overflow-y-auto border border-border">
                {buildFullPrompt() || "Select characters, set a scene, then write director's notes..."}
              </pre>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted">
                <span>{IMAGE_MODELS.find((m) => m.id === model)?.label}</span>
                <span>·</span><span>{aspect}</span>
                {selectedAnchors.length > 0 && <span>· {selectedAnchors.map((a) => a.label).join(", ")}</span>}
                {selectedScene && <span>· {selectedScene.label}</span>}
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
