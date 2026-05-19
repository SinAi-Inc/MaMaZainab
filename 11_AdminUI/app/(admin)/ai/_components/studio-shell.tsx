"use client";

/**
 * Studio v2 shell — left-rail IA for the AI Production Suite.
 *
 * PR 2 scope: IA migration only. No file moves; the existing /videos
 * workspace, /characters list, and Brand Bible page stay where they are.
 * Each section here either renders an existing in-tree component
 * (Workbench, Bible, History) or bridges to an existing page
 * (Projects → /videos/[id], Cast → /characters, Delivery → coming soon).
 *
 * URL is synced via ?view=<section>&project=<id> so deep links work.
 */

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FolderKanban,
  Wand2,
  Clapperboard,
  Users,
  BookOpen,
  History,
  Truck,
  Zap,
  AlertTriangle,
  Film,
  Layers3,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { StudioTabs } from "./studio-tabs";
import { CharacterPromptTool } from "./character-prompt-tool";
import { HistoryTab } from "./history-tab";
import { ShotStageCard } from "./storyboard/shot-stage-card";
import type { Character } from "@/lib/characters/schema";
import type { MenuCategory, MenuItem } from "@/lib/menu/schema";
import type { ProviderSummary } from "@/lib/video/provider-info";
import type { ProjectStatus, Scene, Shot, Take } from "@/lib/videos/schema";
import { PROJECT_STATUS_META } from "@/lib/videos/schema";
import { detectCharacterIds } from "@/lib/ai/brand-bible";

export type SectionId =
  | "projects"
  | "workbench"
  | "storyboard"
  | "cast"
  | "bible"
  | "history"
  | "delivery";

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  { id: "projects", label: "Projects", icon: FolderKanban, hint: "Films, ads, idents" },
  { id: "workbench", label: "Workbench", icon: Wand2, hint: "Image / Video / Prompts" },
  { id: "storyboard", label: "Storyboard", icon: Clapperboard, hint: "Scenes, shots, takes" },
  { id: "cast", label: "Cast & Anchors", icon: Users, hint: "Brand-locked characters" },
  { id: "bible", label: "Prompt Bible", icon: BookOpen, hint: "Anchors & rules" },
  { id: "history", label: "History", icon: History, hint: "All generations" },
  { id: "delivery", label: "Delivery", icon: Truck, hint: "Exports & cuts" },
];

export type ProjectSummary = {
  id: string;
  title: string;
  logline: string;
  status: ProjectStatus;
  aspectRatio: string;
  targetDurationSec: number;
  defaultModel: string;
  posterUrl: string;
  tags: string[];
  updatedAt: string;
  scenes: number;
  shots: number;
  takes: number;
  approved: number;
};

export function StudioShell({
  characters,
  menuCategories,
  menuItems,
  nvidiaKeySet,
  nimAvailable,
  videoProviders,
  projects,
  scenes,
  shots,
  takes,
  initialView,
  initialProject,
}: {
  characters: Character[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  nvidiaKeySet: boolean;
  nimAvailable: boolean;
  videoProviders: ProviderSummary[];
  projects: ProjectSummary[];
  scenes: Scene[];
  shots: Shot[];
  takes: Take[];
  initialView: SectionId;
  initialProject: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [view, setView] = useState<SectionId>(initialView);
  const [project, setProject] = useState<string>(initialProject);

  const updateUrl = useCallback(
    (nextView: SectionId, nextProject: string = project) => {
      const params = new URLSearchParams(search?.toString() ?? "");
      params.set("view", nextView);
      if (nextProject) params.set("project", nextProject);
      else params.delete("project");
      router.replace(`/ai?${params.toString()}`, { scroll: false });
    },
    [router, search, project],
  );

  const go = useCallback(
    (next: SectionId) => {
      setView(next);
      updateUrl(next, project);
    },
    [updateUrl, project],
  );

  const selectProject = useCallback(
    (id: string, jumpTo: SectionId = "storyboard") => {
      setProject(id);
      setView(jumpTo);
      updateUrl(jumpTo, id);
    },
    [updateUrl],
  );

  const currentProject = useMemo(
    () => projects.find((p) => p.id === project) ?? null,
    [projects, project],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            AI Production Suite
          </p>
          <h2 className="text-2xl font-semibold mt-1">Studio</h2>
          <p className="text-sm text-muted mt-1">
            Brand-locked generation, storyboarding, and delivery — all in one place.
          </p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Left rail */}
        <nav className="space-y-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = view === s.id;
            return (
              <button
                key={s.id}
                onClick={() => go(s.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group",
                  isActive
                    ? "bg-brand-green/10 border border-brand-green/30"
                    : "border border-transparent hover:bg-surface-2",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0 mt-0.5",
                    isActive ? "text-brand-green-deep" : "text-muted group-hover:text-foreground",
                  )}
                />
                <span className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      isActive ? "text-brand-green-deep" : "text-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-muted truncate">{s.hint}</span>
                </span>
              </button>
            );
          })}
          {currentProject && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted px-3 mb-1">
                Active project
              </p>
              <div className="px-3 py-2 rounded-lg bg-surface-2 text-xs">
                <p className="font-medium truncate">{currentProject.title}</p>
                <p className="text-muted mt-0.5">
                  {currentProject.shots} shots · {currentProject.approved} approved
                </p>
              </div>
            </div>
          )}
        </nav>

        {/* Main panel */}
        <main className="min-w-0">
          {view === "projects" && (
            <ProjectsPanel projects={projects} onOpen={(id) => selectProject(id, "storyboard")} />
          )}
          {view === "workbench" && (
            <StudioTabs
              characters={characters}
              menuCategories={menuCategories}
              menuItems={menuItems}
              nvidiaKeySet={nvidiaKeySet}
              nimAvailable={nimAvailable}
              videoProviders={videoProviders}
            />
          )}
          {view === "storyboard" && (
            <StoryboardPanel
              project={currentProject}
              scenes={scenes}
              shots={shots}
              takes={takes}
              characters={characters}
              onPickProject={() => go("projects")}
            />
          )}
          {view === "cast" && <CastPanel characters={characters} />}
          {view === "bible" && <CharacterPromptTool characters={characters} />}
          {view === "history" && <HistoryTab />}
          {view === "delivery" && (
            <DeliveryPanel project={currentProject} scenes={scenes} shots={shots} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------- Section panels ---------- */

function StatusPill({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  const tones = {
    neutral: "bg-zinc-200 text-zinc-700",
    info: "bg-blue-100 text-blue-700",
    warning: "bg-brand-yellow/30 text-brand-ink",
    success: "bg-brand-green/15 text-brand-green-deep",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full",
        tones[meta.tone],
      )}
    >
      {meta.label}
    </span>
  );
}

function fmtDuration(s: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function ProjectsPanel({
  projects,
  onOpen,
}: {
  projects: ProjectSummary[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Projects</h3>
          <p className="text-xs text-muted">
            Each project owns its own script, shots, takes, and budget.
          </p>
        </div>
        <Link href="/videos/new">
          <Button variant="primary">
            <Plus className="size-4" /> New project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-muted text-sm">
            No projects yet —{" "}
            <Link href="/videos/new" className="text-brand-green-deep underline">
              create your first
            </Link>
            .
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card
              key={p.id}
              className="group overflow-hidden flex flex-col hover:border-brand-green/40 transition cursor-pointer"
              onClick={() => onOpen(p.id)}
            >
              <div className="relative aspect-video bg-brand-ink overflow-hidden">
                {p.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.posterUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30">
                    <Film className="size-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-2 left-2">
                  <StatusPill status={p.status} />
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-xs text-white/70 font-mono">
                    {p.aspectRatio} · {fmtDuration(p.targetDurationSec)}
                  </span>
                  <span className="text-xs text-white/70 font-mono">{p.defaultModel}</span>
                </div>
              </div>

              <CardBody className="flex-1 flex flex-col gap-2">
                <p className="font-semibold leading-tight group-hover:text-brand-green-deep">
                  {p.title}
                </p>
                {p.logline && (
                  <p className="text-xs text-muted line-clamp-2 italic">{p.logline}</p>
                )}
                <div className="grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-border text-center">
                  <Stat icon={<Layers3 className="size-3.5" />} label="Scenes" value={p.scenes} />
                  <Stat icon={<Clapperboard className="size-3.5" />} label="Shots" value={p.shots} />
                  <Stat icon={<Clock className="size-3.5" />} label="Takes" value={p.takes} />
                  <Stat
                    icon={<CheckCircle2 className="size-3.5" />}
                    label="Done"
                    value={`${p.approved}/${p.shots || 0}`}
                    tone="success"
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: "success";
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted">
        {icon} {label}
      </div>
      <div
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "success" && "text-brand-green-deep",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function StoryboardPanel({
  project,
  scenes,
  shots,
  takes,
  characters,
  onPickProject,
}: {
  project: ProjectSummary | null;
  scenes: Scene[];
  shots: Shot[];
  takes: Take[];
  characters: Character[];
  onPickProject: () => void;
}) {
  if (!project) {
    return (
      <Card>
        <CardBody className="py-16 text-center">
          <Clapperboard className="size-10 text-muted mx-auto mb-3" />
          <h3 className="font-semibold">No project selected</h3>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">
            Pick a project from the Projects section to view its storyboard, run shot generations,
            and approve takes.
          </p>
          <Button variant="ghost" className="mt-4" onClick={onPickProject}>
            Open Projects <ArrowRight className="size-4" />
          </Button>
        </CardBody>
      </Card>
    );
  }

  const projectScenes = scenes
    .filter((s) => s.projectId === project.id)
    .sort((a, b) => a.sort - b.sort || a.number - b.number);
  const projectShots = shots.filter((s) => s.projectId === project.id);
  const projectTakes = takes.filter((t) => t.projectId === project.id);

  // Auto-anchor selection per shot: any active character whose name appears in
  // Detect character anchors for a shot from its description/prompt using
  // fuzzy name matching (e.g. "Wong" matches "Shang Hong Wong").
  // Do NOT force a fallback character into shots that don't mention one —
  // aerial/establishing/environment shots should generate without character injection.
  function anchorsForShot(shot: Shot): string[] {
    const text = `${shot.description} ${shot.prompt}`;
    return detectCharacterIds(text, characters);
  }

  const pct = project.shots ? Math.round((project.approved / project.shots) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Project bar */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clapperboard className="size-5 text-brand-green-deep" />
            {project.title}
          </h3>
          {project.logline && (
            <p className="text-xs text-muted italic mt-0.5 max-w-2xl line-clamp-1">{project.logline}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={project.status} />
          <Link href={`/videos/${project.id}/edit`}>
            <Button variant="ghost">Edit script</Button>
          </Link>
          <Link href={`/videos/${project.id}`}>
            <Button variant="ghost">
              Legacy view <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Scenes" value={project.scenes} />
        <SummaryCard label="Shots" value={project.shots} />
        <SummaryCard label="Takes" value={project.takes} />
        <SummaryCard label="Approved" value={`${project.approved} (${pct}%)`} tone="success" />
      </div>

      {/* Scene-grouped shot grid */}
      {projectScenes.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center space-y-2">
            <p className="text-sm text-muted">No scenes yet — parse a script to seed the storyboard.</p>
            <Link href={`/videos/${project.id}/edit`}>
              <Button variant="primary">Open script editor</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {projectScenes.map((scene) => {
            const sceneShots = projectShots
              .filter((s) => s.sceneId === scene.id)
              .sort((a, b) => a.sort - b.sort);
            return (
              <section key={scene.id} className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h4 className="text-sm font-semibold">
                    Scene {scene.number}
                    {scene.heading && <span className="text-muted font-normal"> — {scene.heading}</span>}
                  </h4>
                  <span className="text-[11px] text-muted">{sceneShots.length} shots</span>
                </div>
                {sceneShots.length === 0 ? (
                  <p className="text-xs text-muted italic px-2">No shots in this scene.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {sceneShots.map((shot) => (
                      <ShotStageCard
                        key={shot.id}
                        shot={shot}
                        takes={projectTakes.filter((t) => t.shotId === shot.id)}
                        characters={characters}
                        projectId={project.id}
                        selectedAnchors={anchorsForShot(shot)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success";
}) {
  return (
    <Card>
      <CardBody className="py-3">
        <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
        <p
          className={cn(
            "text-lg font-semibold tabular-nums mt-0.5",
            tone === "success" && "text-brand-green-deep",
          )}
        >
          {value}
        </p>
      </CardBody>
    </Card>
  );
}

function CastPanel({ characters }: { characters: Character[] }) {
  const active = characters.filter((c) => c.active !== false);
  const [pending, setPending] = useState<string | null>(null);
  const [validateResult, setValidateResult] = useState<{
    characterId: string;
    url: string;
    condensedPrompt: string;
  } | null>(null);

  async function handleRegenerate(characterId: string, mode?: string) {
    setPending(`regen-${characterId}-${mode ?? ""}`);
    try {
      const { regenerateCharacterReference } = await import("@/lib/characters/actions");
      await regenerateCharacterReference(characterId, mode);
      // router.refresh() would be ideal but CastPanel is inside a client shell;
      // the parent's RSC data will refresh on next navigation.
    } catch (err) {
      alert(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setPending(null);
    }
  }

  async function handleValidate(characterId: string, mode?: string) {
    setPending(`validate-${characterId}-${mode ?? ""}`);
    try {
      const { validateCharacterRender } = await import("@/lib/characters/actions");
      const result = await validateCharacterRender(characterId, mode);
      setValidateResult({ characterId, ...result });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Cast & Anchors</h3>
          <p className="text-xs text-muted">
            Canonical characters with locked reference images. Used by Brand-Lock and the
            keyframe pipeline.
          </p>
        </div>
        <Link href="/characters">
          <Button variant="ghost">
            Manage <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>

      {active.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-muted text-sm">
            No active characters.{" "}
            <Link href="/characters/new" className="text-brand-green-deep underline">
              Add one
            </Link>
            .
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {active.map((c) => {
            const ref = c.referenceImages?.[0]?.url ?? "";
            const modes = (c as unknown as { modes?: { id?: string; label: string }[] }).modes;
            return (
              <Card key={c.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-brand-ink overflow-hidden">
                  {ref ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ref}
                      alt={c.name}
                      className="absolute inset-0 size-full object-cover opacity-90"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/30">
                      <Users className="size-10" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    {c.subtitle && <p className="text-[11px] text-white/70">{c.subtitle}</p>}
                  </div>
                </div>
                <CardBody className="space-y-2 py-3">
                  {/* Mode chips */}
                  {Array.isArray(modes) && modes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {modes.map((m) => (
                        <span
                          key={m.label}
                          className="text-[10px] px-1.5 py-0.5 rounded-full border border-border bg-surface text-muted"
                        >
                          {m.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => handleRegenerate(c.id)}
                      className="flex items-center gap-1 text-[11px] font-medium text-brand-green-deep hover:underline disabled:opacity-50"
                    >
                      {pending === `regen-${c.id}-` ? (
                        <span className="inline-block size-3 border-2 border-brand-green-deep border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Wand2 className="size-3" />
                      )}
                      Regen ref
                    </button>
                    <span className="text-border">|</span>
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => handleValidate(c.id)}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-foreground hover:underline disabled:opacity-50"
                    >
                      {pending === `validate-${c.id}-` ? (
                        <span className="inline-block size-3 border-2 border-muted border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Zap className="size-3" />
                      )}
                      Validate
                    </button>
                    <Link
                      href={`/characters/${c.id}`}
                      className="ml-auto text-[11px] text-muted hover:text-foreground"
                    >
                      Edit →
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Validate result modal */}
      {validateResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="max-w-lg w-full">
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Validation render</h4>
                <button
                  onClick={() => setValidateResult(null)}
                  className="text-muted hover:text-foreground text-lg leading-none"
                >
                  ×
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={validateResult.url}
                alt="Validation render"
                className="w-full rounded-md border border-border"
              />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">
                  Condensed prompt (what SD1.5 saw)
                </p>
                <pre className="text-[10px] whitespace-pre-wrap bg-surface-2 rounded p-2 border border-border font-sans max-h-32 overflow-auto">
                  {validateResult.condensedPrompt}
                </pre>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function DeliveryPanel({
  project,
  scenes,
  shots,
}: {
  project: ProjectSummary | null;
  scenes: Scene[];
  shots: Shot[];
}) {
  if (!project) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <Truck className="size-10 text-muted mx-auto mb-3" />
          <h3 className="font-semibold">No project selected</h3>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">
            Pick a project from Projects to see delivery options.
          </p>
        </CardBody>
      </Card>
    );
  }

  const projectScenes = scenes
    .filter((s) => s.projectId === project.id)
    .sort((a, b) => a.sort - b.sort || a.number - b.number);
  const projectShots = shots.filter((s) => s.projectId === project.id);
  const approvedKeyframes = projectShots.filter((s) => s.keyframeApprovedAt && s.keyframeUrl);

  function downloadManifest() {
    const manifest = projectScenes.map((scene) => {
      const sceneShots = projectShots
        .filter((s) => s.sceneId === scene.id)
        .sort((a, b) => a.sort - b.sort);
      return {
        scene: scene.number,
        heading: scene.heading,
        shots: sceneShots.map((s) => ({
          id: s.id,
          number: s.number,
          type: s.type,
          description: s.description,
          prompt: s.prompt,
          keyframeUrl: s.keyframeUrl,
          keyframeApproved: !!s.keyframeApprovedAt,
          keyframeSeed: s.keyframeSeed,
          durationSec: s.durationSec,
        })),
      };
    });
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(project?.title ?? "project").replace(/\s+/g, "_")}_prompt_manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="size-5 text-brand-green-deep" />
            Delivery
          </h3>
          <p className="text-xs text-muted">
            Approved stills, prompt manifest, and per-scene contact sheets for{" "}
            <span className="font-medium">{project.title}</span>.
          </p>
        </div>
        <Button variant="primary" onClick={downloadManifest}>
          Export manifest JSON
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Total shots" value={projectShots.length} />
        <SummaryCard label="Approved keyframes" value={approvedKeyframes.length} tone="success" />
        <SummaryCard
          label="Completion"
          value={projectShots.length ? `${Math.round((approvedKeyframes.length / projectShots.length) * 100)}%` : "—"}
        />
      </div>

      {/* Per-scene contact sheets */}
      {projectScenes.map((scene) => {
        const sceneShots = projectShots
          .filter((s) => s.sceneId === scene.id)
          .sort((a, b) => a.sort - b.sort);
        const withKeyframe = sceneShots.filter((s) => s.keyframeUrl);
        if (withKeyframe.length === 0) return null;
        return (
          <section key={scene.id} className="space-y-2">
            <h4 className="text-sm font-semibold">
              Scene {scene.number}
              {scene.heading && <span className="text-muted font-normal"> — {scene.heading}</span>}
              <span className="text-[11px] text-muted font-normal ml-2">
                {withKeyframe.length} frame{withKeyframe.length === 1 ? "" : "s"}
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {withKeyframe.map((s) => (
                <a
                  key={s.id}
                  href={s.keyframeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "relative aspect-video rounded-md overflow-hidden border bg-brand-ink group",
                    s.keyframeApprovedAt ? "border-brand-green/40" : "border-border",
                  )}
                  title={`Shot ${s.number}: ${s.description?.slice(0, 60) ?? "—"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.keyframeUrl}
                    alt={`Shot ${s.number}`}
                    className="absolute inset-0 size-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-[9px] text-white font-mono">
                      {s.number}
                      {s.keyframeApprovedAt && " ✓"}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        );
      })}

      {approvedKeyframes.length === 0 && (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted">
            No approved keyframes yet. Approve shots in the Storyboard panel to populate delivery.
          </CardBody>
        </Card>
      )}
    </div>
  );
}
