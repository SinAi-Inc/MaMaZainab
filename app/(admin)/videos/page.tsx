import Link from "next/link";
import {
  Plus,
  Film,
  Clapperboard,
  Layers3,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { readStudio } from "@/lib/videos/store";
import {
  PROJECT_STATUS_META,
  type ProjectStatus,
} from "@/lib/videos/schema";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

function fmtDuration(s: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default async function VideosPage() {
  const state = await readStudio();
  const projects = [...state.projects].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
  );

  const counts = (id: string) => {
    const scenes = state.scenes.filter((s) => s.projectId === id).length;
    const shots = state.shots.filter((s) => s.projectId === id);
    const takes = state.takes.filter((t) => t.projectId === id).length;
    const approved = shots.filter((s) => s.status === "approved").length;
    return { scenes, shots: shots.length, takes, approved };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Generation Studio
          </p>
          <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
            <Clapperboard className="size-5 text-brand-green-deep" />
            Video Projects
          </h2>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Upload a script, parse it into scenes &amp; shots, then generate and
            review AI-rendered takes per shot until each one is approved for the
            master cut.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/videos/new">
            <Button variant="primary">
              <Plus className="size-4" /> New project
            </Button>
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center text-muted">
            No projects yet —{" "}
            <Link href="/videos/new" className="text-brand-green-deep underline">
              create your first
            </Link>
            .
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => {
            const c = counts(p.id);
            return (
              <Card
                key={p.id}
                className="group overflow-hidden flex flex-col hover:border-brand-green/40 transition"
              >
                <Link
                  href={`/videos/${p.id}`}
                  className="relative aspect-video bg-brand-ink overflow-hidden"
                >
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
                    <span className="text-xs text-white/70 font-mono">
                      {p.defaultModel}
                    </span>
                  </div>
                </Link>

                <CardBody className="flex-1 flex flex-col gap-2">
                  <Link
                    href={`/videos/${p.id}`}
                    className="font-semibold leading-tight hover:text-brand-green-deep"
                  >
                    {p.title}
                  </Link>
                  {p.logline && (
                    <p className="text-xs text-muted line-clamp-2 italic">
                      {p.logline}
                    </p>
                  )}

                  <div className="grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-border text-center">
                    <Stat
                      icon={<Layers3 className="size-3.5" />}
                      label="Scenes"
                      value={c.scenes}
                    />
                    <Stat
                      icon={<Clapperboard className="size-3.5" />}
                      label="Shots"
                      value={c.shots}
                    />
                    <Stat
                      icon={<Clock className="size-3.5" />}
                      label="Takes"
                      value={c.takes}
                    />
                    <Stat
                      icon={<CheckCircle2 className="size-3.5" />}
                      label="Done"
                      value={`${c.approved}/${c.shots || 0}`}
                      tone="success"
                    />
                  </div>

                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.tags.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
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
      <div
        className={cn(
          "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted",
        )}
      >
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
