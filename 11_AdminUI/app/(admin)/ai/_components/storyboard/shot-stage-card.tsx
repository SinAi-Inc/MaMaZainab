"use client";

/**
 * PR 3 - The new Shot Card.
 *
 * Stage-gated production card:
 *   Brief → Prompt → Keyframe → Motion → Audio → Approve
 *
 * Drives the locked-keyframe pipeline shipped in PR 1:
 *   - generateShotKeyframe / approveShotKeyframe
 *   - generateTake (motion takes - start frame is the approved keyframe)
 *   - approveTake (final approval gate)
 *
 * Audio stage is a placeholder until the audio actions land.
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  Sparkles,
  Image as ImageIcon,
  Video,
  Volume2,
  CheckCircle2,
  Check,
  RefreshCw,
  Wand2,
  Play,
  AlertTriangle,
  Lock,
  Pencil,
  ExternalLink,
  Save,
  Loader2,
  Plus,
  Eye,
  X,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  SHOT_TYPE_META,
  SHOT_STATUS_META,
  TAKE_STATUS_META,
  MODEL_META,
  type Shot,
  type Take,
  type VideoModel,
} from "@/lib/videos/schema";
import type { Character } from "@/lib/characters/schema";
import {
  generateShotKeyframe,
  approveShotKeyframe,
  selectKeyframeFromHistory,
  uploadShotKeyframe,
  generateTake,
  approveTake,
  pollTake,
  updateShotAudio,
  previewShotPrompt,
  type ShotPromptBreakdown,
} from "@/lib/videos/actions";
import { recommendBestModel, recommendProviders } from "@/lib/video/recommend";
import { checkBrandLock } from "@/lib/video/brand-lock";

type StageId = "brief" | "prompt" | "keyframe" | "motion" | "audio" | "approve";

const STAGES: { id: StageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "brief", label: "Brief", icon: FileText },
  { id: "prompt", label: "Prompt", icon: Sparkles },
  { id: "keyframe", label: "Keyframe", icon: ImageIcon },
  { id: "motion", label: "Motion", icon: Video },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "approve", label: "Approve", icon: CheckCircle2 },
];

type StageState = "locked" | "todo" | "active" | "done";

export function ShotStageCard({
  shot,
  takes,
  characters,
  projectId,
  selectedAnchors,
}: {
  shot: Shot;
  takes: Take[];
  characters: Character[];
  projectId: string;
  selectedAnchors: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [active, setActive] = useState<StageId>(() => initialActiveStage(shot, takes));

  // ---- manual anchor picker (overrides auto-derived selection) ----
  const [anchorIds, setAnchorIds] = useState<string[]>(selectedAnchors);
  useEffect(() => {
    setAnchorIds(selectedAnchors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnchors.join("|")]);

  // ---- stage gates ----
  const briefDone = !!shot.description.trim();
  const promptText = shot.prompt || `${shot.description}${shot.cameraNotes ? `\n${shot.cameraNotes}` : ""}`;
  const promptDone = !!promptText.trim();
  const keyframeGenerated = !!shot.keyframeUrl;
  const keyframeApproved = !!shot.keyframeApprovedAt;
  const motionTakes = takes.filter((t) => t.status === "ready" || t.status === "approved");
  const motionDone = motionTakes.length > 0;
  const approvedTake = takes.find((t) => t.id === shot.approvedTakeId) ?? takes.find((t) => t.status === "approved");
  const fullyApproved = shot.status === "approved" && !!approvedTake;

  const stageStatus: Record<StageId, StageState> = {
    brief: briefDone ? "done" : "active",
    prompt: !briefDone ? "locked" : promptDone ? "done" : "active",
    keyframe: !promptDone ? "locked" : keyframeApproved ? "done" : keyframeGenerated ? "active" : "active",
    motion: !keyframeApproved ? "locked" : motionDone ? "done" : "active",
    audio: !motionDone ? "locked" : "todo",
    approve: !motionDone ? "locked" : fullyApproved ? "done" : "active",
  };

  // ---- brand violations ----
  const violations = useMemo(
    () => checkBrandLock(promptText, anchorIds, characters).violations,
    [promptText, anchorIds, characters],
  );

  // ---- actions ----
  function handleGenerateKeyframe(reroll = false) {
    start(async () => {
      try {
        toast.loading(reroll ? "Re-rolling keyframe…" : "Generating keyframe…", { id: `kf-${shot.id}` });
        await generateShotKeyframe(projectId, shot.id, {
          characterAnchors: anchorIds,
        });
        toast.success("Keyframe ready - review and approve", { id: `kf-${shot.id}` });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Keyframe generation failed", { id: `kf-${shot.id}` });
      }
    });
  }

  function handleApproveKeyframe() {
    start(async () => {
      try {
        await approveShotKeyframe(projectId, shot.id);
        toast.success("Keyframe locked - motion stage unlocked");
        setActive("motion");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Approval failed");
      }
    });
  }

  function handleSelectFromHistory(index: number) {
    start(async () => {
      try {
        await selectKeyframeFromHistory(projectId, shot.id, index);
        toast.success("Previous keyframe restored");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Selection failed");
      }
    });
  }

  function handleUploadKeyframe() {
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
  }

  function handleGenerateTake(model?: VideoModel) {
    start(async () => {
      try {
        toast.loading("Submitting motion take…", { id: `take-${shot.id}` });
        await generateTake({
          projectId,
          shotId: shot.id,
          model: model ?? "runway/gen4",
          prompt: promptText,
        });
        toast.success("Take queued", { id: `take-${shot.id}` });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Take generation failed", { id: `take-${shot.id}` });
      }
    });
  }

  function handleApproveTake(takeId: string) {
    start(async () => {
      try {
        await approveTake(takeId);
        toast.success("Take approved - shot complete");
        setActive("approve");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Approval failed");
      }
    });
  }

  const shotMeta = SHOT_STATUS_META[shot.status];
  const statusTones = {
    neutral: "bg-zinc-200 text-zinc-700",
    info: "bg-blue-100 text-blue-700",
    success: "bg-brand-green/15 text-brand-green-deep",
    danger: "bg-red-100 text-red-700",
  } as const;

  return (
    <Card className={cn("overflow-hidden", fullyApproved && "border-brand-green/40")}>
      {/* ---- Header ---- */}
      <div className="px-4 pt-4 pb-3 border-b border-border bg-surface-2/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted">Shot {shot.number || "—"}</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface border border-border">
                {SHOT_TYPE_META[shot.type].label}
              </span>
              <span className="text-[10px] text-muted">{shot.durationSec}s</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full",
                  statusTones[shotMeta.tone],
                )}
              >
                {shotMeta.label}
              </span>
            </div>
            <p className="text-sm font-medium leading-snug mt-1.5 line-clamp-2">
              {shot.description || <span className="text-muted italic">No description</span>}
            </p>
          </div>
          <a
            href={`/videos/${projectId}/edit#shot=${shot.id}`}
            className="shrink-0 p-1.5 rounded hover:bg-surface text-muted hover:text-foreground"
            title="Edit shot in workspace"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {/* Stage chip row */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-0.5">
          {STAGES.map((s, i) => {
            const state = stageStatus[s.id];
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <div key={s.id} className="flex items-center shrink-0">
                <button
                  onClick={() => state !== "locked" && setActive(s.id)}
                  disabled={state === "locked"}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                    state === "locked" && "opacity-40 cursor-not-allowed border-border bg-surface text-muted",
                    state === "todo" && "border-border bg-surface text-muted hover:bg-surface-2",
                    state === "active" && !isActive && "border-amber-300 bg-amber-50 text-amber-800",
                    state === "active" && isActive && "border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-200",
                    state === "done" && !isActive && "border-brand-green/40 bg-brand-green/10 text-brand-green-deep",
                    state === "done" && isActive && "border-brand-green bg-brand-green/15 text-brand-green-deep ring-2 ring-brand-green/30",
                  )}
                  title={s.label}
                >
                  {state === "done" ? <Check className="size-3" /> : state === "locked" ? <Lock className="size-3" /> : <Icon className="size-3" />}
                  <span>{s.label}</span>
                </button>
                {i < STAGES.length - 1 && (
                  <span className={cn("w-2 h-px mx-0.5", state === "done" ? "bg-brand-green/40" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Active stage detail ---- */}
      <CardBody className="space-y-3">
        {active === "brief" && (
          <BriefStage shot={shot} projectId={projectId} />
        )}
        {active === "prompt" && (
          <PromptStage
            shotId={shot.id}
            prompt={promptText}
            anchorIds={anchorIds}
            onAnchorsChange={setAnchorIds}
            violations={violations}
            characters={characters}
          />
        )}
        {active === "keyframe" && (
          <KeyframeStage
            shot={shot}
            pending={pending}
            onGenerate={() => handleGenerateKeyframe(false)}
            onReroll={() => handleGenerateKeyframe(true)}
            onApprove={handleApproveKeyframe}
            onUpload={handleUploadKeyframe}
            onSelectFromHistory={handleSelectFromHistory}
            violationCount={violations.length}
          />
        )}
        {active === "motion" && (
          <MotionStage
            shot={shot}
            takes={takes}
            pending={pending}
            onGenerate={handleGenerateTake}
            onApprove={handleApproveTake}
          />
        )}
        {active === "audio" && <AudioStage shot={shot} />}
        {active === "approve" && (
          <ApproveStage shot={shot} approvedTake={approvedTake ?? null} />
        )}
      </CardBody>
    </Card>
  );
}

/* ---------- stages ---------- */

function BriefStage({ shot, projectId }: { shot: Shot; projectId: string }) {
  return (
    <div className="space-y-2">
      <Row label="Description">{shot.description || <em className="text-muted">—</em>}</Row>
      {shot.dialogue && <Row label="Dialogue">{shot.dialogue}</Row>}
      {shot.cameraNotes && <Row label="Camera">{shot.cameraNotes}</Row>}
      <div className="pt-2">
        <a
          href={`/videos/${projectId}/edit#shot=${shot.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-brand-green-deep hover:underline"
        >
          <Pencil className="size-3" /> Edit in workspace
        </a>
      </div>
    </div>
  );
}

function PromptStage({
  shotId,
  prompt,
  anchorIds,
  onAnchorsChange,
  violations,
  characters,
}: {
  shotId: string;
  prompt: string;
  anchorIds: string[];
  onAnchorsChange: (ids: string[]) => void;
  violations: ReturnType<typeof checkBrandLock>["violations"];
  characters: Character[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [preview, setPreview] = useState<ShotPromptBreakdown | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  function resolveCharacter(id: string): { c: Character | undefined; modeLabel: string } {
    // Try exact match first, then prefix match for mode-suffixed ids (e.g. chr_wong_warrior -> chr_wong).
    let c = characters.find((c) => c.id === id);
    let modeLabel = "";
    if (!c) {
      c = characters.find((c) => id.startsWith(`${c.id}_`));
      if (c) modeLabel = id.slice(c.id.length + 1).replace(/_/g, " ");
    }
    return { c, modeLabel };
  }

  const anchorLabels = anchorIds.map((id) => {
    const { c, modeLabel } = resolveCharacter(id);
    return c ? `${c.name}${modeLabel ? ` - ${modeLabel}` : ""}` : id;
  });

  // Build pickable options: include each active character plus any of their modes if defined.
  const options = useMemo(() => {
    const out: { id: string; label: string; subLabel?: string }[] = [];
    for (const c of characters) {
      if (!c.active) continue;
      // Always offer the base id
      out.push({ id: c.id, label: c.name });
      const modes = (c as unknown as { modes?: { id: string; label?: string }[] }).modes;
      if (Array.isArray(modes)) {
        for (const m of modes) {
          out.push({ id: `${c.id}_${m.id}`, label: c.name, subLabel: m.label ?? m.id });
        }
      }
    }
    return out;
  }, [characters]);

  function toggle(id: string) {
    onAnchorsChange(anchorIds.includes(id) ? anchorIds.filter((x) => x !== id) : [...anchorIds, id]);
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] uppercase tracking-wider text-muted">Anchors</p>
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="text-[10px] text-brand-green-deep hover:underline inline-flex items-center gap-1"
          >
            <Plus className="size-3" /> {pickerOpen ? "Close picker" : "Edit anchors"}
          </button>
        </div>
        {anchorLabels.length === 0 ? (
          <p className="text-xs text-amber-700">No characters anchored - output will drift.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {anchorIds.map((id, i) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-brand-green/10 border border-brand-green/30 text-brand-green-deep"
              >
                <Lock className="size-2.5" /> {anchorLabels[i]}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="ml-0.5 text-brand-green-deep/70 hover:text-brand-green-deep"
                  title="Remove anchor"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {pickerOpen && (
          <div className="mt-2 border border-border rounded-md bg-surface-2 p-2 max-h-48 overflow-auto">
            <p className="text-[10px] text-muted mb-1">Pick characters to lock for this shot</p>
            <ul className="space-y-0.5">
              {options.map((opt) => {
                const checked = anchorIds.includes(opt.id);
                return (
                  <li key={opt.id}>
                    <label className="flex items-center gap-2 text-xs cursor-pointer hover:bg-surface rounded px-1.5 py-1">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(opt.id)}
                        className="size-3.5 accent-brand-green"
                      />
                      <span className="font-medium">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface border border-border text-muted">
                          {opt.subLabel}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-muted font-mono">{opt.id}</span>
                    </label>
                  </li>
                );
              })}
              {options.length === 0 && <li className="text-xs text-muted italic">No active characters.</li>}
            </ul>
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Resolved prompt</p>
        <pre className="text-[11px] leading-relaxed whitespace-pre-wrap bg-surface-2 border border-border rounded p-2 max-h-40 overflow-auto font-sans">
          {prompt}
        </pre>
      </div>

      {/* ---- Brand-lock preview (what the model actually sees) ---- */}
      <div className="border border-border rounded-md bg-surface-2/40">
        <button
          type="button"
          onClick={async () => {
            if (!previewOpen && !preview) {
              setPreviewLoading(true);
              try {
                const result = await previewShotPrompt(shotId, anchorIds);
                setPreview(result);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Preview failed");
              } finally {
                setPreviewLoading(false);
              }
            }
            setPreviewOpen((o) => !o);
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium hover:bg-surface-2/80 rounded-md"
        >
          <span className="inline-flex items-center gap-1.5">
            <Eye className="size-3" />
            Brand-lock preview
            {preview && (
              <span className="text-[10px] text-muted font-normal">
                ({preview.condensedPositive.length} chars to model)
              </span>
            )}
          </span>
          <span className="text-[10px] text-muted">{previewOpen ? "Hide" : "Inspect"}</span>
        </button>
        {previewOpen && (
          <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border">
            {previewLoading && (
              <p className="text-[11px] text-muted inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" /> Building preview…
              </p>
            )}
            {preview && (
              <>
                {/* Injection checklist */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Brand-lock checklist</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-1 text-[11px]">
                    <ChecklistItem label="Character" ok={preview.injected.character} />
                    <ChecklistItem label="Scene mood" ok={preview.injected.sceneMood} />
                    <ChecklistItem label="Palette" ok={preview.injected.palette} />
                    <ChecklistItem label="Plaid" ok={preview.injected.plaid} />
                    <ChecklistItem label="Negatives" ok={preview.injected.negatives} />
                  </div>
                </div>
                {/* Scene context */}
                {preview.sceneContext ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Scene context</p>
                    <div className="text-[11px] bg-surface border border-border rounded px-2 py-1.5 space-y-0.5">
                      <p>
                        <span className="font-medium">{preview.sceneContext.label}</span>{" "}
                        <span className="text-muted">({preview.sceneContext.value})</span>
                      </p>
                      <p className="text-muted">
                        Mood: <span className="text-foreground">{preview.sceneContext.mood}</span>
                      </p>
                      <p className="text-muted">
                        Colors: <span className="text-foreground">{preview.sceneContext.paletteFocus.join(", ")}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700">
                    No scene context auto-detected - only character + palette will be injected.
                  </p>
                )}
                {/* Condensed positive (SD1.5 sees this) */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-1">
                    Condensed positive <span className="font-normal normal-case">(what SD1.5 sees, ~77 tokens)</span>
                  </p>
                  <pre className="text-[11px] leading-relaxed whitespace-pre-wrap bg-surface border border-border rounded p-2 font-sans">
                    {preview.condensedPositive}
                  </pre>
                </div>
                {/* Condensed negative */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Negative prompt</p>
                  <pre className="text-[10px] leading-relaxed whitespace-pre-wrap bg-surface border border-border rounded p-2 max-h-24 overflow-auto font-sans text-muted">
                    {preview.condensedNegative}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setPreviewLoading(true);
                    try {
                      const result = await previewShotPrompt(shotId, anchorIds);
                      setPreview(result);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Preview failed");
                    } finally {
                      setPreviewLoading(false);
                    }
                  }}
                  className="text-[10px] text-brand-green-deep hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="size-2.5" /> Refresh preview
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {violations.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 space-y-1">
          <p className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="size-3" /> {violations.length} brand-lock issue{violations.length === 1 ? "" : "s"}
          </p>
          <ul className="text-[11px] text-amber-900 list-disc list-inside space-y-0.5">
            {violations.map((v, i) => (
              <li key={i}>{v.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function KeyframeStage({
  shot,
  pending,
  onGenerate,
  onReroll,
  onApprove,
  onUpload,
  onSelectFromHistory,
  violationCount,
}: {
  shot: Shot;
  pending: boolean;
  onGenerate: () => void;
  onReroll: () => void;
  onApprove: () => void;
  onUpload: () => void;
  onSelectFromHistory: (index: number) => void;
  violationCount: number;
}) {
  const approved = !!shot.keyframeApprovedAt;
  const history = shot.keyframeHistory ?? [];
  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-brand-ink rounded-md overflow-hidden border border-border">
        {shot.keyframeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.keyframeUrl} alt="Locked keyframe" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-1">
            <ImageIcon className="size-10" />
            <p className="text-xs">No keyframe yet</p>
          </div>
        )}
        {approved && (
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-brand-green text-white">
            <Lock className="size-2.5" /> APPROVED
          </div>
        )}
        {shot.keyframeUrl && !approved && (
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-white">
            DRAFT
          </div>
        )}
      </div>

      {/* History thumbnails */}
      {history.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted mb-1">
            Previous ({history.length})
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {history.map((h, i) => (
              <button
                key={`${h.url}-${i}`}
                type="button"
                onClick={() => onSelectFromHistory(i)}
                disabled={pending}
                className="shrink-0 w-16 h-10 rounded border border-border overflow-hidden hover:ring-2 hover:ring-brand-green/50 transition-shadow disabled:opacity-50"
                title={`seed: ${h.seed} · ${h.model || "unknown"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.url} alt={`History ${i + 1}`} className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {shot.keyframeSeed > 0 && (
        <p className="text-[10px] text-muted font-mono">seed: {shot.keyframeSeed}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {!shot.keyframeUrl ? (
          <>
            <Button variant="primary" onClick={onGenerate} disabled={pending}>
              <Wand2 className="size-3.5" />
              {pending ? "Generating…" : "Generate keyframe"}
            </Button>
            <Button variant="ghost" onClick={onUpload} disabled={pending}>
              <Upload className="size-3.5" />
              Upload
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onReroll} disabled={pending}>
              <RefreshCw className="size-3.5" />
              {pending ? "Re-rolling…" : "Re-roll"}
            </Button>
            <Button variant="ghost" onClick={onUpload} disabled={pending}>
              <Upload className="size-3.5" />
              Upload
            </Button>
            {!approved && (
              <Button variant="primary" onClick={onApprove} disabled={pending}>
                <CheckCircle2 className="size-3.5" />
                Approve keyframe
              </Button>
            )}
          </>
        )}
      </div>

      {violationCount > 0 && (
        <p className="text-[11px] text-amber-700">
          ⚠ {violationCount} brand-lock issue{violationCount === 1 ? "" : "s"} - review the Prompt stage before generating.
        </p>
      )}
    </div>
  );
}

function MotionStage({
  shot,
  takes,
  pending,
  onGenerate,
  onApprove,
}: {
  shot: Shot;
  takes: Take[];
  pending: boolean;
  onGenerate: (model?: VideoModel) => void;
  onApprove: (id: string) => void;
}) {
  const router = useRouter();
  const sorted = [...takes].sort((a, b) => b.index - a.index);
  const generatingIds = useMemo(
    () =>
      takes
        .filter((t) => t.status === "generating" && t.externalId)
        .map((t) => t.id),
    [takes],
  );

  // Recommend best model for this shot
  const recommendations = useMemo(
    () =>
      recommendProviders({
        type: shot.type,
        description: shot.description,
        dialogue: shot.dialogue,
        cameraNotes: shot.cameraNotes,
      }),
    [shot.type, shot.description, shot.dialogue, shot.cameraNotes],
  );
  const [selectedModel, setSelectedModel] = useState<VideoModel>(
    recommendations[0]?.model ?? "runway/gen4",
  );

  // ---- auto-poll generating takes every 5s ----
  useEffect(() => {
    if (generatingIds.length === 0) return;
    let cancelled = false;
    const tick = async () => {
      let anyChanged = false;
      for (const id of generatingIds) {
        try {
          const updated = await pollTake(id);
          if (updated.status !== "generating") anyChanged = true;
        } catch {
          // Swallow - next tick will retry.
        }
      }
      if (!cancelled && anyChanged) router.refresh();
    };
    const handle = setInterval(tick, 5000);
    // also fire once immediately
    void tick();
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatingIds.join("|")]);

  return (
    <div className="space-y-3">
      {/* Model selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-[10px] uppercase tracking-wider text-muted whitespace-nowrap">Model</label>
        <select
          className="rounded border border-border bg-surface px-2 py-1 text-xs"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as VideoModel)}
        >
          {recommendations.map((rec) => {
            const meta = MODEL_META[rec.model];
            return (
              <option key={rec.model} value={rec.model}>
                {meta?.label ?? rec.model} - {rec.confidence}
              </option>
            );
          })}
        </select>
        {MODEL_META[selectedModel] && (
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: MODEL_META[selectedModel].color }}
            title={MODEL_META[selectedModel].vendor}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted">
          Takes ({takes.length}) - start frame locked to approved keyframe
        </p>
        <Button variant="primary" onClick={() => onGenerate(selectedModel)} disabled={pending}>
          <Play className="size-3.5" />
          {pending ? "Submitting…" : "Generate take"}
        </Button>
      </div>

      {generatingIds.length > 0 && (
        <p className="text-[11px] text-amber-700 flex items-center gap-1.5">
          <Loader2 className="size-3 animate-spin" />
          Polling {generatingIds.length} take{generatingIds.length === 1 ? "" : "s"}…
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="text-xs text-muted italic">No takes yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sorted.map((t) => {
            const meta = TAKE_STATUS_META[t.status];
            const tones = {
              neutral: "bg-zinc-100 text-zinc-700",
              info: "bg-blue-100 text-blue-700",
              warning: "bg-amber-100 text-amber-800",
              success: "bg-brand-green/15 text-brand-green-deep",
              danger: "bg-red-100 text-red-700",
            } as const;
            const isApproved = t.id === shot.approvedTakeId || t.status === "approved";
            return (
              <div
                key={t.id}
                className={cn(
                  "border rounded-md overflow-hidden bg-surface",
                  isApproved ? "border-brand-green/40 ring-1 ring-brand-green/30" : "border-border",
                )}
              >
                <div className="relative aspect-video bg-brand-ink">
                  {t.videoUrl ? (
                    <video src={t.videoUrl} className="absolute inset-0 size-full object-cover" muted loop playsInline />
                  ) : t.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.thumbnailUrl} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/30 text-[10px] gap-1">
                      {t.status === "generating" && <Loader2 className="size-3 animate-spin" />}
                      {t.status === "generating" ? "Generating…" : "—"}
                    </div>
                  )}
                </div>
                <div className="p-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono truncate">Take {t.index} · {t.model}</p>
                    <span className={cn("inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full", tones[meta.tone])}>
                      {meta.label}
                    </span>
                    {t.brandLock && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {(["character", "sceneMood", "palette", "plaid", "negatives"] as const).map((k) => (
                          <span
                            key={k}
                            className={cn(
                              "text-[8px] px-1 py-px rounded",
                              t.brandLock![k]
                                ? "bg-brand-green/10 text-brand-green-deep"
                                : "bg-amber-50 text-amber-700",
                            )}
                            title={`${k}: ${t.brandLock![k] ? "✓" : "✗"}`}
                          >
                            {k[0].toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {t.status === "ready" && !isApproved && (
                    <Button variant="ghost" onClick={() => onApprove(t.id)} disabled={pending}>
                      <CheckCircle2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const VOICE_OPTIONS = [
  { id: "", label: "- choose voice —" },
  { id: "mama_zainab", label: "MaMa Zainab (warm matriarch)" },
  { id: "wong_hong", label: "Wong Hong (calm narrator)" },
  { id: "zuzu", label: "ZuZu (playful kid)" },
  { id: "ghost", label: "Ghost (whispered VO)" },
  { id: "narrator_neutral", label: "Narrator - neutral" },
];

function AudioStage({ shot }: { shot: Shot }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const audio = shot.audio ?? { voLine: "", voice: "", sfxCue: "", voUrl: "", sfxUrl: "" };
  const [voLine, setVoLine] = useState(audio.voLine);
  const [voice, setVoice] = useState(audio.voice);
  const [sfxCue, setSfxCue] = useState(audio.sfxCue);
  const dirty = voLine !== audio.voLine || voice !== audio.voice || sfxCue !== audio.sfxCue;

  function save() {
    start(async () => {
      try {
        await updateShotAudio(shot.id, { voLine, voice, sfxCue });
        toast.success("Audio plan saved");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 flex items-center gap-2">
        <Volume2 className="size-3.5" />
        Audio plan is captured here. ElevenLabs VO + SFX rendering ships in PR 3c - playback stays in post for now.
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted block mb-1">VO line</label>
        <textarea
          value={voLine}
          onChange={(e) => setVoLine(e.target.value)}
          rows={2}
          placeholder='e.g. "Some recipes you eat. This one, you remember."'
          className="w-full text-xs rounded-md border border-border bg-surface px-2 py-1.5 resize-y focus:outline-none focus:ring-2 focus:ring-brand-green/40"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted block mb-1">Voice</label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            aria-label="Voice"
            className="w-full text-xs rounded-md border border-border bg-surface px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          >
            {VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted block mb-1">SFX cue</label>
          <input
            value={sfxCue}
            onChange={(e) => setSfxCue(e.target.value)}
            placeholder="e.g. wok sizzle, distant rain"
            className="w-full text-xs rounded-md border border-border bg-surface px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {dirty && <span className="text-[10px] text-muted italic">unsaved</span>}
        <Button variant="primary" onClick={save} disabled={pending || !dirty}>
          <Save className="size-3.5" />
          {pending ? "Saving…" : "Save audio plan"}
        </Button>
      </div>
    </div>
  );
}

function ApproveStage({ shot, approvedTake }: { shot: Shot; approvedTake: Take | null }) {
  if (shot.status === "approved" && approvedTake) {
    return (
      <div className="rounded-md border border-brand-green/40 bg-brand-green/5 p-4 space-y-2">
        <p className="text-sm font-semibold text-brand-green-deep flex items-center gap-1.5">
          <CheckCircle2 className="size-4" /> Shot approved
        </p>
        <p className="text-xs text-muted">
          Take {approvedTake.index} ({approvedTake.model}) is locked as the final cut for this shot.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm">Pick a take in the Motion stage and approve it to mark this shot complete.</p>
      <p className="text-xs text-muted">
        Approval is reversible - you can re-roll keyframes or generate more takes anytime.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}

function ChecklistItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border",
        ok
          ? "border-brand-green/40 bg-brand-green/10 text-brand-green-deep"
          : "border-amber-300 bg-amber-50 text-amber-800",
      )}
      title={ok ? `${label} injected` : `${label} missing`}
    >
      {ok ? <Check className="size-2.5" /> : <X className="size-2.5" />}
      {label}
    </span>
  );
}

function initialActiveStage(shot: Shot, takes: Take[]): StageId {
  if (!shot.description.trim()) return "brief";
  if (!shot.prompt && !shot.description) return "prompt";
  if (!shot.keyframeUrl) return "keyframe";
  if (!shot.keyframeApprovedAt) return "keyframe";
  if (!takes.some((t) => t.status === "ready" || t.status === "approved")) return "motion";
  if (shot.status === "approved") return "approve";
  return "approve";
}
