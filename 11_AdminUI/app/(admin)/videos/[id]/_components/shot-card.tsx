"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Wand2,
  Play,
  CheckCircle2,
  Trash2,
  Copy,
  Pencil,
  X,
  Plus,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  generateTake,
  updateShot,
  deleteShot,
  approveTake,
  deleteTake,
  uploadTakeVideo,
  setTakeStatus,
  pollTake,
  generateShotKeyframe,
  approveShotKeyframe,
  uploadShotKeyframe,
} from "@/lib/videos/actions";
import {
  SHOT_TYPE_META,
  SHOT_STATUS_META,
  TAKE_STATUS_META,
  MODEL_META,
  type Shot,
  type Take,
  type VideoModel,
  type ShotType,
  type TakeStatus,
} from "@/lib/videos/schema";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MODELS = Object.keys(MODEL_META) as VideoModel[];
const SHOT_TYPES = Object.keys(SHOT_TYPE_META) as ShotType[];

export function ShotCard({
  shot,
  takes,
  defaultModel,
  styleSuffix,
}: {
  shot: Shot;
  takes: Take[];
  defaultModel: string;
  styleSuffix: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [genOpen, setGenOpen] = useState(false);

  const meta = SHOT_STATUS_META[shot.status];
  const statusTones = {
    neutral: "bg-zinc-200 text-zinc-700",
    info: "bg-blue-100 text-blue-700",
    success: "bg-brand-green/15 text-brand-green-deep",
    danger: "bg-red-100 text-brand-red",
  };

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden",
        shot.status === "approved" && "border-brand-green/40",
      )}
    >
      <CardBody className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted">
                Shot {shot.number || "—"}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-2 border border-border">
                {SHOT_TYPE_META[shot.type].label}
              </span>
              <span className="text-[10px] text-muted">
                {shot.durationSec}s
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full",
                  statusTones[meta.tone],
                )}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-sm font-medium leading-tight mt-1.5">
              {shot.description || (
                <span className="text-muted italic">No description</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="p-1.5 rounded hover:bg-surface-2 text-muted hover:text-brand-ink"
              title="Edit shot"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirm("Delete this shot and all its takes?")) return;
                start(async () => {
                  await deleteShot(shot.id);
                  toast.success("Shot deleted");
                  router.refresh();
                });
              }}
              className="p-1.5 rounded hover:bg-red-50 text-muted hover:text-brand-red"
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {editing ? (
          <ShotEditor
            shot={shot}
            onClose={() => setEditing(false)}
          />
        ) : (
          <>
            {(shot.dialogue || shot.cameraNotes) && (
              <div className="space-y-1 text-xs">
                {shot.dialogue && (
                  <p className="italic text-muted">
                    <span className="font-semibold text-brand-ink not-italic">
                      Dialogue:
                    </span>{" "}
                    {shot.dialogue}
                  </p>
                )}
                {shot.cameraNotes && (
                  <p className="text-muted">
                    <span className="font-semibold text-brand-ink">Camera:</span>{" "}
                    {shot.cameraNotes}
                  </p>
                )}
              </div>
            )}

            {shot.prompt && (
              <details className="group rounded-md bg-surface border border-border p-2">
                <summary className="text-[11px] font-medium cursor-pointer text-muted hover:text-brand-ink">
                  Generation prompt
                </summary>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-brand-ink flex-1">
                    {shot.prompt}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        styleSuffix
                          ? `${shot.prompt}\n\n${styleSuffix}`
                          : shot.prompt,
                      );
                      toast.success("Prompt copied");
                    }}
                    className="shrink-0 inline-flex items-center gap-1 text-xs text-brand-green-deep hover:underline"
                  >
                    <Copy className="size-3" /> copy
                  </button>
                </div>
              </details>
            )}

            {/* Keyframe section */}
            <KeyframeSection shot={shot} projectId={shot.projectId} pending={pending} start={start} />

            {/* Takes */}
            {takes.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted">
                  Takes ({takes.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {takes.map((take) => (
                    <TakeTile key={take.id} take={take} />
                  ))}
                </div>
              </div>
            )}

            {/* Generate button */}
            <div className="pt-1">
              {!genOpen ? (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setGenOpen(true)}
                  disabled={pending}
                >
                  <Wand2 className="size-4" /> Generate take
                </Button>
              ) : (
                <GenerateTakeForm
                  shotId={shot.id}
                  projectId={shot.projectId}
                  defaultPrompt={shot.prompt}
                  defaultModel={defaultModel}
                  styleSuffix={styleSuffix}
                  onCancel={() => setGenOpen(false)}
                  onCreated={() => {
                    setGenOpen(false);
                    router.refresh();
                  }}
                />
              )}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function ShotEditor({ shot, onClose }: { shot: Shot; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [data, setData] = useState({
    description: shot.description,
    dialogue: shot.dialogue,
    cameraNotes: shot.cameraNotes,
    prompt: shot.prompt,
    type: shot.type,
    durationSec: shot.durationSec,
    number: shot.number,
  });

  const save = () =>
    start(async () => {
      try {
        await updateShot(shot.id, {
          ...shot,
          ...data,
        });
        toast.success("Shot saved");
        router.refresh();
        onClose();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });

  return (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label>Number</Label>
          <Input
            value={data.number}
            onChange={(e) => setData({ ...data, number: e.target.value })}
          />
        </div>
        <div>
          <Label>Type</Label>
          <select
            value={data.type}
            onChange={(e) =>
              setData({ ...data, type: e.target.value as ShotType })
            }
            className="h-10 w-full rounded-md border border-border-strong bg-white px-2 text-sm"
          >
            {SHOT_TYPES.map((t) => (
              <option key={t} value={t}>
                {SHOT_TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label hint="s">Duration</Label>
          <Input
            type="number"
            value={data.durationSec}
            onChange={(e) =>
              setData({ ...data, durationSec: Number(e.target.value) })
            }
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          rows={2}
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
        />
      </div>
      <div>
        <Label>Dialogue</Label>
        <Textarea
          rows={2}
          value={data.dialogue}
          onChange={(e) => setData({ ...data, dialogue: e.target.value })}
        />
      </div>
      <div>
        <Label>Camera notes</Label>
        <Input
          value={data.cameraNotes}
          onChange={(e) => setData({ ...data, cameraNotes: e.target.value })}
        />
      </div>
      <div>
        <Label hint="full text-to-video prompt">Prompt</Label>
        <Textarea
          rows={5}
          className="font-mono text-xs"
          value={data.prompt}
          onChange={(e) => setData({ ...data, prompt: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button onClick={save} disabled={pending} type="button">
          Save
        </Button>
      </div>
    </div>
  );
}

function GenerateTakeForm({
  shotId,
  projectId,
  defaultPrompt,
  defaultModel,
  styleSuffix,
  onCancel,
  onCreated,
}: {
  shotId: string;
  projectId: string;
  defaultPrompt: string;
  defaultModel: string;
  styleSuffix: string;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [pending, start] = useTransition();
  const [model, setModel] = useState<VideoModel>(
    (MODELS as string[]).includes(defaultModel)
      ? (defaultModel as VideoModel)
      : "runway/gen4",
  );
  const [prompt, setPrompt] = useState(
    defaultPrompt
      ? styleSuffix
        ? `${defaultPrompt}\n\n${styleSuffix}`
        : defaultPrompt
      : "",
  );
  const [videoUrl, setVideoUrl] = useState("");
  const [seed, setSeed] = useState("");
  const [uploading, setUploading] = useState(false);

  const submit = () =>
    start(async () => {
      try {
        await generateTake({
          projectId,
          shotId,
          index: 1, // server overrides
          model,
          prompt,
          externalId: "",
          seed,
          status: videoUrl ? "ready" : "queued",
          videoUrl,
          thumbnailUrl: "",
          durationSec: 0,
          notes: "",
        });
        toast.success("Take registered");
        onCreated();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = await uploadTakeVideo(fd);
      setVideoUrl(url);
      toast.success("Uploaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-brand-green/40 bg-brand-green/5 p-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-brand-green-deep uppercase tracking-wider">
          New take
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted hover:text-brand-ink"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Model</Label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as VideoModel)}
            className="h-9 w-full rounded-md border border-border-strong bg-white px-2 text-xs"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {MODEL_META[m].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Seed</Label>
          <Input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="optional"
            className="h-9 text-xs"
          />
        </div>
      </div>

      <div>
        <Label hint="snapshot stored on the take">Prompt</Label>
        <Textarea
          rows={6}
          className="font-mono text-[11px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div>
        <Label>
          <span className="inline-flex items-center gap-1.5">
            <LinkIcon className="size-3" /> Result URL or upload
          </span>
        </Label>
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="paste rendered video URL or use Upload"
          className="text-xs"
        />
        <label className="mt-1.5 inline-flex items-center gap-1.5 px-2 h-8 text-xs rounded-md border border-border-strong bg-white hover:bg-surface cursor-pointer">
          <Upload className="size-3" />
          {uploading ? "Uploading…" : "Upload .mp4"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
        </label>
        {!videoUrl && (
          <p className="mt-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            NVIDIA Stable Video Diffusion is deprecated. Generate your video in the Studio&nbsp;→&nbsp;Video tab (Runway, Kling, or Google Flow), then paste the URL or upload the file above.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button onClick={submit} disabled={pending || uploading || !videoUrl} type="button">
          <Wand2 className="size-4" />
          {pending ? "Saving…" : "Register take"}
        </Button>
      </div>
    </div>
  );
}

function TakeTile({ take }: { take: Take }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const meta = TAKE_STATUS_META[take.status];
  const tones = {
    neutral: "bg-zinc-700 text-white",
    info: "bg-blue-600 text-white",
    warning: "bg-brand-yellow text-brand-ink",
    success: "bg-brand-green text-white",
    danger: "bg-brand-red text-white",
  };

  const onApprove = () =>
    start(async () => {
      try {
        await approveTake(take.id);
        toast.success("Take approved");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });

  const onDelete = () => {
    if (!confirm("Delete this take?")) return;
    start(async () => {
      await deleteTake(take.id);
      toast.success("Take deleted");
      router.refresh();
    });
  };

  const cycleStatus = (next: TakeStatus) =>
    start(async () => {
      try {
        await setTakeStatus(take.id, next);
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });

  return (
    <div
      className={cn(
        "relative aspect-video rounded-md overflow-hidden bg-zinc-900 group",
        take.status === "approved" && "ring-2 ring-brand-green",
      )}
    >
      {take.videoUrl ? (
        <video
          src={take.videoUrl}
          className="absolute inset-0 size-full object-cover"
          muted
          loop
          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
          poster={take.thumbnailUrl || undefined}
          preload="metadata"
        />
      ) : take.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={take.thumbnailUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-[10px]">
          {take.status === "generating" ? (
            <span className="animate-pulse">generating…</span>
          ) : take.status === "queued" ? (
            "queued - paste URL"
          ) : (
            "no preview"
          )}
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-1 left-1 right-1 flex items-center justify-between text-[9px]">
        <span className={cn("px-1.5 py-0.5 rounded font-medium", tones[meta.tone])}>
          #{take.index} · {meta.label}
        </span>
        <span
          className="px-1.5 py-0.5 rounded text-white font-mono"
          style={{ backgroundColor: MODEL_META[take.model].color }}
        >
          {MODEL_META[take.model].label}
        </span>
      </div>

      {/* Actions */}
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition">
        {take.videoUrl && (
          <a
            href={take.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1 rounded bg-black/60 text-white hover:bg-black/80"
            title="Open"
          >
            <Play className="size-3" />
          </a>
        )}
        <div className="ml-auto flex items-center gap-1">
          {take.status === "generating" && (
            <button
              type="button"
              onClick={() =>
                start(async () => {
                  try {
                    const updated = await pollTake(take.id);
                    if (updated.status === "ready") toast.success("Video ready!");
                    else if (updated.status === "failed") toast.error(updated.notes || "Generation failed");
                    else toast("Still generating…");
                    router.refresh();
                  } catch (e: unknown) {
                    toast.error(e instanceof Error ? e.message : "Poll failed");
                  }
                })
              }
              disabled={pending}
              className="p-1 rounded bg-brand-yellow/90 text-brand-ink hover:bg-brand-yellow"
              title="Check status"
            >
              <Play className="size-3" />
            </button>
          )}
          {take.status === "queued" && (
            <button
              type="button"
              onClick={() => cycleStatus("ready")}
              disabled={pending}
              className="p-1 rounded bg-blue-600/90 text-white hover:bg-blue-700"
              title="Mark ready"
            >
              <Plus className="size-3" />
            </button>
          )}
          {take.status !== "approved" && (
            <button
              type="button"
              onClick={onApprove}
              disabled={pending}
              className="p-1 rounded bg-brand-green text-white hover:bg-brand-green-deep"
              title="Approve"
            >
              <CheckCircle2 className="size-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="p-1 rounded bg-brand-red text-white hover:bg-red-700"
            title="Delete"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function KeyframeSection({
  shot,
  projectId,
  pending,
  start,
}: {
  shot: Shot;
  projectId: string;
  pending: boolean;
  start: (cb: () => Promise<void>) => void;
}) {
  const router = useRouter();
  const approved = !!shot.keyframeApprovedAt;

  const handleGenerate = () =>
    start(async () => {
      try {
        toast.loading("Generating keyframe…", { id: `kf-${shot.id}` });
        await generateShotKeyframe(projectId, shot.id, { characterAnchors: [] });
        toast.success("Keyframe ready - review and approve", { id: `kf-${shot.id}` });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Keyframe generation failed", { id: `kf-${shot.id}` });
      }
    });

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      start(async () => {
        try {
          toast.loading("Uploading keyframe…", { id: `kf-up-${shot.id}` });
          const fd = new FormData();
          fd.append("file", file);
          await uploadShotKeyframe(projectId, shot.id, fd);
          toast.success("Keyframe uploaded", { id: `kf-up-${shot.id}` });
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed", { id: `kf-up-${shot.id}` });
        }
      });
    };
    input.click();
  };

  const handleApprove = () =>
    start(async () => {
      try {
        await approveShotKeyframe(projectId, shot.id);
        toast.success("Keyframe approved - locked");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Approval failed");
      }
    });

  return (
    <div className="rounded-md border border-border bg-surface p-2 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
        Keyframe
      </p>
      {shot.keyframeUrl ? (
        <>
          <div className="relative aspect-video rounded overflow-hidden bg-brand-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot.keyframeUrl}
              alt="Locked keyframe"
              className="absolute inset-0 size-full object-cover"
            />
            {approved && (
              <div className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-brand-green text-white">
                <Lock className="size-2.5" /> LOCKED
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 h-7 text-xs"
              onClick={handleGenerate}
              disabled={pending}
            >
              <RefreshCw className="size-3" /> Re-roll
            </Button>
            <Button
              variant="ghost"
              className="flex-1 h-7 text-xs"
              onClick={handleUpload}
              disabled={pending}
            >
              <Upload className="size-3" /> Upload
            </Button>
            {!approved && (
              <Button
                variant="primary"
                className="flex-1 h-7 text-xs"
                onClick={handleApprove}
                disabled={pending}
              >
                <CheckCircle2 className="size-3" /> Approve
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="aspect-video rounded bg-zinc-100 border border-border flex flex-col items-center justify-center text-muted gap-1">
            <ImageIcon className="size-6 opacity-40" />
            <p className="text-[10px]">No keyframe yet</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1 h-8 text-xs"
              onClick={handleGenerate}
              disabled={pending}
            >
              <Wand2 className="size-3.5" />
              {pending ? "Generating…" : "Generate"}
            </Button>
            <Button
              variant="ghost"
              className="flex-1 h-8 text-xs"
              onClick={handleUpload}
              disabled={pending}
            >
              <Upload className="size-3.5" /> Upload
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
