"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, Trash2, ArrowLeft } from "lucide-react";
import {
  ProjectInputSchema,
  type ProjectInput,
  type ProjectInputRaw,
  type Project,
  PROJECT_STATUS_META,
  MODEL_META,
  type ProjectStatus,
  type VideoModel,
} from "@/lib/videos/schema";
import { updateProject, deleteProject } from "@/lib/videos/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import Link from "next/link";

const STATUSES = Object.keys(PROJECT_STATUS_META) as ProjectStatus[];
const MODELS = Object.keys(MODEL_META) as VideoModel[];
const ASPECTS = ["2.39:1", "16:9", "9:16", "1:1", "4:3"];

export function EditProjectForm({ project }: { project: Project }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectInputRaw, unknown, ProjectInput>({
    resolver: zodResolver(ProjectInputSchema),
    defaultValues: {
      title: project.title,
      logline: project.logline,
      synopsis: project.synopsis,
      status: project.status,
      script: project.script,
      scriptSourcePath: project.scriptSourcePath,
      targetDurationSec: project.targetDurationSec,
      aspectRatio: project.aspectRatio,
      defaultModel: project.defaultModel,
      styleSuffix: project.styleSuffix,
      posterUrl: project.posterUrl,
      masterCutUrl: project.masterCutUrl,
      budgetUsd: project.budgetUsd ?? 0,
      tags: project.tags,
    },
  });

  const onSubmit = (data: ProjectInput) =>
    start(async () => {
      try {
        await updateProject(project.id, {
          ...data,
          tags:
            typeof data.tags === "string"
              ? String(data.tags)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : data.tags,
        });
        toast.success("Project saved");
        router.push(`/videos/${project.id}`);
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });

  const onDelete = () => {
    if (!confirm(`Delete project "${project.title}"? This cannot be undone.`))
      return;
    start(async () => {
      await deleteProject(project.id);
      toast.success("Project deleted");
      router.push("/videos");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <Link
          href={`/videos/${project.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand-ink"
        >
          <ArrowLeft className="size-3" /> Back to project
        </Link>
        <h2 className="text-2xl font-semibold mt-1">Edit project</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-5">
            <div>
              <Label required>Title</Label>
              <Input {...register("title")} />
              <FieldError>{errors.title?.message}</FieldError>
            </div>
            <div>
              <Label>Logline</Label>
              <Input {...register("logline")} />
            </div>
            <div>
              <Label>Synopsis</Label>
              <Textarea rows={3} {...register("synopsis")} />
            </div>
            <div>
              <Label hint="path inside repo">Source script path</Label>
              <Input {...register("scriptSourcePath")} />
            </div>
            <div>
              <Label hint="appended to every shot prompt">Style suffix</Label>
              <Textarea rows={5} className="text-xs font-mono" {...register("styleSuffix")} />
            </div>
            <div>
              <Label>Poster URL</Label>
              <Input {...register("posterUrl")} placeholder="/uploads/posters/..." />
            </div>
            <div>
              <Label>Master cut URL</Label>
              <Input {...register("masterCutUrl")} />
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <Label>Status</Label>
                <select
                  {...register("status")}
                  className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PROJECT_STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label hint="seconds">Target</Label>
                  <Input type="number" {...register("targetDurationSec")} />
                </div>
                <div>
                  <Label>Aspect</Label>
                  <select
                    {...register("aspectRatio")}
                    className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm"
                  >
                    {ASPECTS.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>Default model</Label>
                <select
                  {...register("defaultModel")}
                  className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm"
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {MODEL_META[m].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label hint="comma-separated">Tags</Label>
                <Input
                  {...register("tags" as never)}
                  defaultValue={project.tags.join(", ")}
                />
              </div>
              <div>
                <Label hint="USD — 0 = unlimited">Video budget cap</Label>
                <Input type="number" step="0.01" min="0" {...register("budgetUsd")} />
                <p className="text-[11px] text-muted mt-1">
                  Spent so far: <span className="font-mono">${(project.spentUsd ?? 0).toFixed(2)}</span>
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onDelete}
          disabled={pending}
          className="text-brand-red hover:text-brand-red"
        >
          <Trash2 className="size-4" /> Delete project
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/videos/${project.id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            <Save className="size-4" />
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}
