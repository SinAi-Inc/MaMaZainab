"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Video, ExternalLink, Users, RotateCcw } from "lucide-react";
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

const ASPECTS = ["16:9", "9:16", "1:1", "2.39:1", "4:3"];
const DURATIONS = [4, 5, 6, 8, 10, 15];

const STYLE_PRESETS = [
  "Cinematic — ARRI Alexa 35, anamorphic, warm Mediterranean highlights + cool teal shadows",
  "Food photography — overhead, soft diffused light, shallow depth of field",
  "Street documentary — handheld, natural light, 24fps",
  "Animated — bold outlines, flat color, smooth motion",
  "Product showcase — turntable, studio lighting, white cyclorama",
];

// External video generation services
const SERVICES = [
  {
    id: "runway",
    label: "Runway Gen-4",
    url: "https://app.runwayml.com",
    description: "Best for cinematic motion + character consistency",
    badge: "Recommended",
    badgeColor: "bg-brand-green/10 text-brand-green-deep border-brand-green/30",
  },
  {
    id: "kling",
    label: "Kling AI 3.0",
    url: "https://kling.ai",
    description: "Strong on Asian talent + food scenes",
    badge: null,
    badgeColor: "",
  },
  {
    id: "veo",
    label: "Google Flow (Veo 3.1)",
    url: "https://labs.google/fx/tools/video-fx",
    description: "Highest fidelity, native audio + Veo 3.1 model",
    badge: null,
    badgeColor: "",
  },
  {
    id: "pika",
    label: "Pika 2.2",
    url: "https://pika.art",
    description: "Fast turnaround, great for social clips",
    badge: null,
    badgeColor: "",
  },
] as const;

export function VideoGenTab({ characters }: { characters: Character[] }) {
  const characterAnchors = useMemo(
    () => buildAnchorsFromCharacters(characters),
    [characters],
  );
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState("");
  const [anchorValues, setAnchorValues] = useState<string[]>([]);
  const [sceneValue, setSceneValue] = useState("");
  const [includeBrand, setIncludeBrand] = useState(true);
  const [copied, setCopied] = useState<string | null>(null); // tracks which button copied

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
      isVideo: true,
    });
    const withStyle = stylePreset ? `Style: ${stylePreset}\n\n${assembled}` : assembled;
    if (!withStyle.trim()) return "";
    return `${withStyle}\n\nDuration: ${duration}s | Aspect: ${aspect}`;
  }

  function handleCopy(serviceId?: string) {
    const full = buildFullPrompt();
    if (!full.trim()) { toast.error("Write a prompt first"); return; }
    navigator.clipboard.writeText(full);
    const key = serviceId ?? "generic";
    setCopied(key);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(null), 2500);
    // Record in history
    recordGeneration({
      type: "video",
      model: serviceId ?? "external",
      prompt: full,
      characterAnchor: anchorValues.join(","),
      sceneContext: sceneValue,
      aspect,
      duration,
      stylePreset,
      status: "completed",
      elapsedMs: 0,
    }).catch(() => {});
  }

  function handleLaunch(service: (typeof SERVICES)[number]) {
    handleCopy(service.id);
    setTimeout(() => window.open(service.url, "_blank", "noopener,noreferrer"), 300);
  }

  function handleReset() {
    setPrompt("");
    setAnchorValues([]);
    setSceneValue("");
    setAspect("16:9");
    setDuration(5);
    setStylePreset("");
    setIncludeBrand(true);
    setCopied(null);
    toast.success("All fields reset");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Left: prompt builder */}
      <div className="space-y-5">
        {/* External service banner */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <Video className="mt-0.5 size-4 flex-shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold">Video Prompt Studio</p>
            <p className="mt-0.5 text-xs text-blue-700">
              Build a brand-locked prompt below, then launch directly into Runway, Kling, Veo, or Pika. Your prompt is auto-copied on launch.
            </p>
          </div>
        </div>

        <PresetPicker
          mode="video"
          anchors={characterAnchors}
          onLoad={(p) => {
            setPrompt(p.prompt);
            setAspect(p.aspect);
            setSceneValue(p.sceneValue);
            setAnchorValues(p.anchorValue ? [p.anchorValue] : []);
            toast.success(`Loaded Shot ${p.shotNumber} — ${p.shotDescription}`);
          }}
        />

        {/* Aspect + Duration */}
        <div className="grid grid-cols-2 gap-3">
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
              <option key={s} value={s}>{s.split("—")[0].trim()}</option>
            ))}
          </select>
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

        {/* Character Anchors — multi-select */}
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
              Multi-character frame — Cast Rules will be injected automatically.
            </p>
          )}
        </div>

        {/* Prompt textarea */}
        <div>
          <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
            Director&apos;s Notes
          </label>
          <Textarea
            rows={4}
            placeholder="Camera motion, action, mood, framing, lighting details..."
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

        {/* Copy-only action */}
        <div className="flex gap-3">
          <Button onClick={handleReset} variant="ghost" className="shrink-0 text-muted" title="Reset all fields" aria-label="Reset">
            <RotateCcw className="size-4" />
          </Button>
          <Button onClick={() => handleCopy()} variant="outline" className="flex-1">
            {copied === "generic" ? <><Check className="size-4" /> Copied!</> : <><Copy className="size-4" /> Copy Full Prompt</>}
          </Button>
        </div>
      </div>

      {/* Right: prompt preview + service launchers */}
      <div className="space-y-4">
        <Card className="sticky top-4">
          <CardBody className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Assembled Prompt
            </h4>
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
            <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-brand-ink bg-surface rounded-md p-3 max-h-64 overflow-y-auto border border-border">
              {buildFullPrompt() || "Select scene, characters, and write director's notes..."}
            </pre>
            <div className="flex flex-wrap gap-x-2 text-[10px] text-muted">
              <span>{aspect}</span>
              <span>·</span><span>{duration}s</span>
              {selectedAnchors.length > 0 && <span>· {selectedAnchors.map((a) => a.label).join(", ")}</span>}
              {selectedScene && <span>· {selectedScene.label}</span>}
            </div>
          </CardBody>
        </Card>

        {/* Service launchers */}
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Launch in</p>
          <div className="space-y-2">
            {SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleLaunch(service)}
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-surface hover:bg-surface-2 px-4 py-3 text-left transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{service.label}</span>
                    {service.badge && (
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${service.badgeColor}`}>
                        {service.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">{service.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted group-hover:text-brand-green transition-colors shrink-0">
                  {copied === service.id ? (
                    <><Check className="size-3.5 text-brand-green" /><span className="text-brand-green">Copied!</span></>
                  ) : (
                    <><Copy className="size-3.5" /><ExternalLink className="size-3.5" /></>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

