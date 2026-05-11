"use client";

import { useState } from "react";
import { ImageIcon, Video, BookOpen, History, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageGenTab } from "./image-gen-tab";
import { VideoGenTab } from "./video-gen-tab";
import { CharacterPromptTool } from "./character-prompt-tool";
import { HistoryTab } from "./history-tab";
import type { Character } from "@/lib/characters/schema";

type Tab = "image" | "video" | "prompts" | "history";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "image", label: "Image Generation", icon: ImageIcon },
  { id: "video", label: "Video Generation", icon: Video },
  { id: "prompts", label: "Prompt Bible", icon: BookOpen },
  { id: "history", label: "History", icon: History },
];

export function StudioTabs({ characters, nvidiaKeySet, nimAvailable }: { characters: Character[]; nvidiaKeySet: boolean; nimAvailable: boolean }) {
  const [active, setActive] = useState<Tab>("image");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Creative</p>
          <h2 className="text-2xl font-semibold mt-1">Studio</h2>
          <p className="text-sm text-muted mt-1">
            Generate brand-compliant images, videos, and prompt anchors.
          </p>
        </div>
        {/* NVIDIA key status pill */}
        {nvidiaKeySet ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 shrink-0 mt-1">
            <Zap className="size-3" />
            NVIDIA API ready
          </span>
        ) : (
          <a
            href="/settings"
            className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 shrink-0 mt-1 hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle className="size-3" />
            Add NVIDIA key
          </a>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-brand-green text-brand-green-deep"
                  : "border-transparent text-muted hover:text-foreground hover:border-border",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {active === "image" && <ImageGenTab characters={characters} nimAvailable={nimAvailable} />}
      {active === "video" && <VideoGenTab characters={characters} />}
      {active === "prompts" && <CharacterPromptTool characters={characters} />}
      {active === "history" && <HistoryTab />}
    </div>
  );
}
