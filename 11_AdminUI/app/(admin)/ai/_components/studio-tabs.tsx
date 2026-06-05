"use client";

import { useState } from "react";
import { ImageIcon, Video, BookOpen, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageGenTab } from "./image-gen-tab";
import { VideoGenTab } from "./video-gen-tab";
import { CharacterPromptTool } from "./character-prompt-tool";
import { HistoryTab } from "./history-tab";
import type { Character } from "@/lib/characters/schema";
import type { MenuCategory, MenuItem } from "@/lib/menu/schema";
import type { ProviderSummary } from "@/lib/video/provider-info";

type Tab = "image" | "video" | "prompts" | "history";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "image", label: "Image Generation", icon: ImageIcon },
  { id: "video", label: "Video Generation", icon: Video },
  { id: "prompts", label: "Prompt Bible", icon: BookOpen },
  { id: "history", label: "History", icon: History },
];

export function StudioTabs({ characters, menuCategories, menuItems, nimAvailable, comfyConfigured, videoProviders }: {
  characters: Character[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  nvidiaKeySet?: boolean;
  nimAvailable: boolean;
  comfyConfigured: boolean;
  videoProviders: ProviderSummary[];
}) {
  const [active, setActive] = useState<Tab>("image");

  return (
    <div className="space-y-6">
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
      {active === "image" && <ImageGenTab characters={characters} menuCategories={menuCategories} menuItems={menuItems} nimAvailable={nimAvailable} comfyConfigured={comfyConfigured} />}
      {active === "video" && <VideoGenTab characters={characters} providers={videoProviders} />}
      {active === "prompts" && <CharacterPromptTool characters={characters} />}
      {active === "history" && <HistoryTab />}
    </div>
  );
}
