"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROMPT_PACK,
  mapPackSceneToContext,
  mapPackCharacterToAnchor,
  type PromptPackShot,
  type PromptPackScene,
} from "@/lib/prompt-pack/loader";
import type { CharacterAnchorOption } from "@/lib/ai/brand-bible";

export type PresetLoaded = {
  prompt: string;
  aspect: string;
  sceneValue: string;
  anchorValue: string;
  shotNumber: string;
  shotDescription: string;
};

interface PresetPickerProps {
  /** Whether to load videoPrompt or imagePrompt fields */
  mode: "image" | "video";
  /** Available anchor values from buildAnchorsFromCharacters */
  anchors: CharacterAnchorOption[];
  /** Called when user clicks "Load Preset" */
  onLoad: (preset: PresetLoaded) => void;
}

export function PresetPicker({ mode, anchors, onLoad }: PresetPickerProps) {
  const [open, setOpen] = useState(false);
  const [sceneId, setSceneId] = useState<string>("");
  const [shotId, setShotId] = useState<string>("");

  const scenes = PROMPT_PACK.scenes;
  const selectedScene = useMemo<PromptPackScene | undefined>(
    () => scenes.find((s) => s.id === sceneId),
    [scenes, sceneId],
  );
  const selectedShot = useMemo<PromptPackShot | undefined>(
    () => selectedScene?.shots.find((s) => s.id === shotId),
    [selectedScene, shotId],
  );

  const anchorValues = useMemo(() => anchors.map((a) => a.value), [anchors]);

  function handleLoad() {
    if (!selectedScene || !selectedShot) return;
    const sceneValue = mapPackSceneToContext(selectedScene.number);
    const slug = selectedShot.characters[0] ?? "";
    const anchorValue = slug ? mapPackCharacterToAnchor(slug, anchorValues) : "";
    const prompt = mode === "video"
      ? selectedShot.videoPrompt || selectedShot.description
      : selectedShot.imagePrompt || selectedShot.description;
    onLoad({
      prompt,
      aspect: PROMPT_PACK.project.aspectRatio || "2.39:1",
      sceneValue,
      anchorValue,
      shotNumber: selectedShot.number,
      shotDescription: selectedShot.description,
    });
    setOpen(false);
  }

  return (
    <div className="rounded-lg border border-brand-yellow/40 bg-brand-yellow/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-brand-yellow/10 rounded-lg transition"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-brand-green-deep" />
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-green-deep">
            Campaign Presets
          </span>
          <span className="text-[10px] text-muted">
            {PROMPT_PACK.scenes.length} scenes · 33 shots
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-brand-yellow/30 pt-3">
          {/* Scene picker */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-medium text-muted block mb-1">
              Scene
            </label>
            <select
              value={sceneId}
              onChange={(e) => {
                setSceneId(e.target.value);
                setShotId("");
              }}
              aria-label="Select campaign scene"
              className="w-full text-sm border border-border-strong rounded-md px-2 py-1.5 bg-white"
            >
              <option value="">- Pick a scene —</option>
              {scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  Scene {s.number} - {s.heading.replace(/SCENE \d+\s*/i, "").split("\\-")[0].trim()} ({s.totalSec}s)
                </option>
              ))}
            </select>
          </div>

          {/* Shot picker */}
          {selectedScene && (
            <div>
              <label className="text-[10px] uppercase tracking-wider font-medium text-muted block mb-1">
                Shot
              </label>
              <select
                value={shotId}
                onChange={(e) => setShotId(e.target.value)}
                aria-label="Select shot"
                className="w-full text-sm border border-border-strong rounded-md px-2 py-1.5 bg-white"
              >
                <option value="">- Pick a shot —</option>
                {selectedScene.shots.map((s) => (
                  <option key={s.id} value={s.id}>
                    Shot {s.number} · {s.type} · {s.durationSec}s - {s.description.slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preview + load */}
          {selectedShot && (
            <>
              <div className="rounded-md bg-white border border-border p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-muted">
                  <Film className="size-3" />
                  Shot {selectedShot.number} · {selectedShot.type} · {selectedShot.durationSec}s
                  {selectedShot.characters.length > 0 && (
                    <span>· chars: {selectedShot.characters.join(", ")}</span>
                  )}
                </div>
                <p className="text-[11px] text-brand-ink/80 leading-relaxed line-clamp-3">
                  {selectedShot.description}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoad}
                className="w-full px-3 py-2 rounded-md bg-brand-green text-white text-xs font-medium uppercase tracking-wider hover:bg-brand-green-deep transition"
              >
                Load Preset into Prompt
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
