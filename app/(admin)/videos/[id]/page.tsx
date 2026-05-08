import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clapperboard,
  Layers3,
  Pencil,
  ArrowLeft,
  Wand2,
  FileText,
} from "lucide-react";
import { readProject } from "@/lib/videos/store";
import {
  PROJECT_STATUS_META,
  SHOT_STATUS_META,
  type ProjectStatus,
  type ShotStatus,
} from "@/lib/videos/schema";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
import { ScriptPanel } from "./_components/script-panel";
import { ShotCard } from "./_components/shot-card";

function StatusPill({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  const tones = {
    neutral: "bg-zinc-200 text-zinc-700",
    info: "bg-blue-100 text-blue-700",
    warning: "bg-brand-yellow/30 text-brand-ink",
    success: "bg-brand-green/15 text-brand-green-deep",
  };
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

function ShotStatusDot({ status }: { status: ShotStatus }) {
  const meta = SHOT_STATUS_META[status];
  const tones = {
    neutral: "bg-zinc-400",
    info: "bg-blue-500",
    success: "bg-brand-green",
    danger: "bg-brand-red",
  };
  return (
    <span
      className={cn("size-1.5 rounded-full", tones[meta.tone])}
      title={meta.label}
    />
  );
}

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await readProject(id);
  if (!data) notFound();
  const { project, scenes, shots, takes } = data;

  const totalShots = shots.length;
  const approvedShots = shots.filter((s) => s.status === "approved").length;
  const progress = totalShots ? Math.round((approvedShots / totalShots) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="flex-1">
          <Link
            href="/videos"
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand-ink"
          >
            <ArrowLeft className="size-3" /> All projects
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <Clapperboard className="size-5 text-brand-green-deep" />
            <h2 className="text-2xl font-semibold">{project.title}</h2>
            <StatusPill status={project.status} />
          </div>
          {project.logline && (
            <p className="text-sm text-muted mt-1 italic max-w-3xl">
              {project.logline}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/videos/${project.id}/edit`}>
            <Button variant="ghost">
              <Pencil className="size-4" /> Edit project
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Aspect" value={project.aspectRatio} />
        <Kpi
          label="Target"
          value={
            project.targetDurationSec
              ? `${Math.floor(project.targetDurationSec / 60)}:${String(
                  project.targetDurationSec % 60,
                ).padStart(2, "0")}`
              : "—"
          }
        />
        <Kpi label="Scenes" value={scenes.length} />
        <Kpi label="Shots" value={`${approvedShots}/${totalShots}`} />
        <Kpi label="Takes" value={takes.length} />
      </div>

      {/* Progress */}
      <div className="rounded-md border border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
          <span>Approved shots</span>
          <span className="font-mono">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
          <div
            className="h-full bg-brand-green transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Two-column workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6">
        {/* Script panel */}
        <ScriptPanel project={project} />

        {/* Scenes & shots */}
        <div className="space-y-6 min-w-0">
          {scenes.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center text-muted">
                <FileText className="mx-auto size-8 mb-3 opacity-40" />
                <p className="text-sm">
                  No scenes yet. Paste a script in the panel and click{" "}
                  <span className="font-semibold">Parse script</span> to extract
                  scenes &amp; shots automatically.
                </p>
              </CardBody>
            </Card>
          ) : (
            scenes.map((scene) => {
              const sceneShots = shots.filter((s) => s.sceneId === scene.id);
              return (
                <section key={scene.id} className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                        Scene {scene.number}
                      </p>
                      <h3 className="font-semibold text-brand-ink leading-tight flex items-center gap-2">
                        <Layers3 className="size-4 text-brand-green-deep" />
                        {scene.heading || `Untitled scene ${scene.number}`}
                      </h3>
                      {scene.summary && (
                        <p className="text-xs text-muted mt-1 line-clamp-2 max-w-2xl">
                          {scene.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      {sceneShots.map((s) => (
                        <ShotStatusDot key={s.id} status={s.status} />
                      ))}
                      <span className="ml-1 tabular-nums">
                        {sceneShots.length} shots
                      </span>
                    </div>
                  </div>

                  {sceneShots.length === 0 ? (
                    <Card>
                      <CardBody className="py-6 text-center text-muted text-xs">
                        No shots in this scene yet.
                      </CardBody>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {sceneShots.map((shot) => (
                        <ShotCard
                          key={shot.id}
                          shot={shot}
                          takes={takes.filter((t) => t.shotId === shot.id)}
                          defaultModel={project.defaultModel}
                          styleSuffix={project.styleSuffix}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })
          )}

          {scenes.length > 0 && (
            <Card className="border-dashed">
              <CardBody className="py-6 text-center text-xs text-muted">
                <Wand2 className="mx-auto size-5 mb-2 opacity-40" />
                Re-parse the script in the left panel to refresh scenes &amp; shots
                — your existing takes will be deleted.
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="py-3">
        <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
        <p className="text-lg font-semibold tabular-nums mt-0.5">{value}</p>
      </CardBody>
    </Card>
  );
}
