"use client";

import { useState } from "react";
import { ImageIcon, Video, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageGenTab } from "./image-gen-tab";
import { VideoGenTab } from "./video-gen-tab";
import { CharacterPromptTool } from "./character-prompt-tool";
import type { Character } from "@/lib/characters/schema";

type Tab = "image" | "video" | "prompts";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "image", label: "Image Generation", icon: ImageIcon },
  { id: "video", label: "Video Generation", icon: Video },
  { id: "prompts", label: "Prompt Bible", icon: BookOpen },
];

export function StudioTabs({ characters }: { characters: Character[] }) {
  const [active, setActive] = useState<Tab>("image");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Creative</p>
        <h2 className="text-2xl font-semibold mt-1">Studio</h2>
        <p className="text-sm text-muted mt-1">
          Generate brand-compliant images, videos, and prompt anchors.
        </p>
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
      {active === "image" && <ImageGenTab characters={characters} />}
      {active === "video" && <VideoGenTab characters={characters} />}
      {active === "prompts" && <CharacterPromptTool characters={characters} />}
    </div>
  );
}
